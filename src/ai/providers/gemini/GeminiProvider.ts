/**
 * Gemini LLM Provider
 * 
 * Implements LLMProvider interface using Google's Gemini API
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { 
  LLMProvider, 
  PlanRequest, 
  PlanResponse, 
  RespondRequest, 
  RespondResponse,
  ProviderContext,
  ActionPlan 
} from '../interfaces.js';
import { SYSTEM_PROMPTS } from '../../prompts/system.js';
import { actionPlanSchema } from '../../schemas/action.schema.js';
import { logger } from '../../../logger.js';
import { redactSecrets } from '../../audit/redact.js';

export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;
  private hasKey: boolean;

  constructor(apiKey?: string, modelName: string = 'gemini-1.5-flash') {
    const key = apiKey || process.env.GEMINI_API_KEY || '';
    if (!key) {
      logger.warn('gemini.provider.no_api_key');
    }
    this.hasKey = !!key;
    this.client = new GoogleGenerativeAI(key);
    this.modelName = modelName;
    this.model = this.client.getGenerativeModel({ model: modelName });
  }

  /**
   * Step A: Generate action plan from user message
   */
  async plan(request: PlanRequest, ctx?: ProviderContext): Promise<PlanResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = request.systemPrompt || SYSTEM_PROMPTS.planner(
        request.context?.availableTools || []
      );

      const conversationContext = request.context?.conversationHistory
        ?.map(m => `${m.role}: ${m.content}`)
        .join('\n') || '';

      const fullPrompt = `${systemPrompt}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}
User message: ${request.message}

IMPORTANT: Respond ONLY with a JSON object matching:
{
  "intent": "string describing what the user wants",
  "toolCalls": [{"tool": "toolName", "args": {...}}],
  "responseStyle": "short" | "normal" | "detailed"
}`;

      logger.debug('gemini.plan.request', { 
        messageLength: request.message.length,
        hasContext: !!request.context,
        requestId: ctx?.requestId 
      });

      const planModel = this.client.getGenerativeModel({
        model: this.modelName,
        generationConfig: { responseMimeType: "application/json" },
      });
      const result = await planModel.generateContent(fullPrompt);
      const responseText = result.response.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in response");
        }
        parsed = JSON.parse(jsonMatch[0]);
      }
      
      // Validate with Zod
      const validatedPlan = actionPlanSchema.parse(parsed);

      const latencyMs = Date.now() - startTime;
      
      logger.info('gemini.plan.success', { 
        intent: validatedPlan.intent,
        toolCount: validatedPlan.toolCalls.length,
        latencyMs,
        requestId: ctx?.requestId 
      });

      return {
        plan: validatedPlan as ActionPlan,
        rawOutput: responseText,
        meta: {
          provider: this.name,
          model: this.modelName,
          latencyMs,
        }
      };

    } catch (error) {
      logger.error('gemini.plan.error', { 
        error: redactSecrets(String(error)),
        requestId: ctx?.requestId 
      });
      
      // Return a fallback plan for graceful degradation
      return {
        plan: {
          intent: 'unknown',
          toolCalls: [],
          responseStyle: 'normal',
        },
        meta: {
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        }
      };
    }
  }

  /**
   * Step C: Generate final response grounded in tool results
   */
  async respond(request: RespondRequest, ctx?: ProviderContext): Promise<RespondResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = request.systemPrompt || SYSTEM_PROMPTS.responder(request.style);

      const toolResultsSummary = request.toolResults
        .map(tr => {
          if (tr.error) {
            return `Tool "${tr.tool}" failed: ${tr.error}`;
          }
          return `Tool "${tr.tool}" returned: ${JSON.stringify(tr.result, null, 2)}`;
        })
        .join('\n\n');

      const conversationContext = request.context?.conversationHistory
        ?.map(m => `${m.role}: ${m.content}`)
        .join('\n') || '';

      const fullPrompt = `${systemPrompt}

${conversationContext ? `Previous conversation:\n${conversationContext}\n\n` : ''}
User asked: ${request.message}

Tool results:
${toolResultsSummary}

Based on the tool results above, provide a ${request.style} response to the user.
IMPORTANT: Only use information from the tool results. Do not make up data.`;

      logger.debug('gemini.respond.request', { 
        toolCount: request.toolResults.length,
        style: request.style,
        requestId: ctx?.requestId 
      });

      const result = await this.model.generateContent(fullPrompt);
      const answer = result.response.text();

      const latencyMs = Date.now() - startTime;

      logger.info('gemini.respond.success', { 
        answerLength: answer.length,
        latencyMs,
        requestId: ctx?.requestId 
      });

      return {
        answer,
        meta: {
          provider: this.name,
          model: this.modelName,
          latencyMs,
        }
      };

    } catch (error) {
      logger.error('gemini.respond.error', { 
        error: redactSecrets(String(error)),
        requestId: ctx?.requestId 
      });
      
      return {
        answer: "Sorry, there was an error generating the response. Please try again.",
        meta: {
          provider: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
        }
      };
    }
  }

  /**
   * Simple text generation (backward compatibility)
   */
  async generate(prompt: string, ctx?: ProviderContext): Promise<string> {
    const startTime = Date.now();
    
    try {
      if (!this.hasKey) {
        return '';
      }
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      
      logger.debug('gemini.generate.success', { 
        latencyMs: Date.now() - startTime,
        requestId: ctx?.requestId 
      });
      
      return text;
    } catch (error) {
      logger.error('gemini.generate.error', { error: redactSecrets(String(error)) });
      return '';
    }
  }

  async analyzeImage(
    prompt: string,
    buffer: Buffer,
    mimeType: string,
    ctx?: ProviderContext,
  ): Promise<string> {
    const startTime = Date.now();
    try {
      if (!this.hasKey) {
        return '';
      }
      const model = this.client.getGenerativeModel({ model: this.modelName });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType,
          },
        },
      ]);
      const text = result.response.text();
      logger.debug("gemini.analyze_image.success", {
        latencyMs: Date.now() - startTime,
        requestId: ctx?.requestId,
      });
      return text;
    } catch (error) {
      logger.error("gemini.analyze_image.error", { error: redactSecrets(String(error)) });
      return "";
    }
  }

  getRawClient(): GoogleGenerativeAI {
    return this.client;
  }
}

// Singleton instance for convenience
let defaultProvider: GeminiProvider | null = null;

export function getGeminiProvider(apiKey?: string): GeminiProvider {
  if (!defaultProvider) {
    defaultProvider = new GeminiProvider(apiKey);
  }
  return defaultProvider;
}
