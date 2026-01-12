/**
 * Log Redaction Helper
 * 
 * Utility to redact sensitive information from logs
 */

const SENSITIVE_PATTERNS = [
  /KEY[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /SECRET[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /TOKEN[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /PASS(WORD)?[=:]\s*["']?[^\s"']{4,}["']?/gi,
  /API_KEY[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /AUTH[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /CREDENTIAL[S]?[=:]\s*["']?[A-Za-z0-9_-]{10,}["']?/gi,
  /Bearer\s+[A-Za-z0-9_.-]+/gi,
  /Basic\s+[A-Za-z0-9+/=]+/gi,
];

const SENSITIVE_KEYS = [
  'password',
  'pass',
  'secret',
  'token',
  'key',
  'apikey',
  'api_key',
  'auth',
  'credential',
  'credentials',
  'authorization',
  'x-api-key',
  'x-signature',
];

/**
 * Redact sensitive values from a string
 */
export function redactSecrets(input: string): string {
  let result = input;
  
  for (const pattern of SENSITIVE_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const prefix = match.split(/[=:]/)[0];
      return `${prefix}=[REDACTED]`;
    });
  }
  
  return result;
}

/**
 * Redact sensitive values from an object (deep)
 */
export function redactObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return redactSecrets(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObject(item));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if key matches sensitive pattern
      if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = redactObject(value);
      } else if (typeof value === 'string') {
        result[key] = redactSecrets(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  return obj;
}

/**
 * Safe JSON stringify with redaction
 */
export function safeStringify(obj: unknown, indent?: number): string {
  try {
    const redacted = redactObject(obj);
    return JSON.stringify(redacted, null, indent);
  } catch (error) {
    return '[Unable to stringify]';
  }
}
