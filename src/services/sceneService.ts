<<<<<<< HEAD
import { generateGeminiReply } from "./ai/geminiClient.js";
=======
import { generateGeminiReply } from "./geminiClient.js";
>>>>>>> 6901a4280378b282c9841f0d0516659efe72d59e

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  promptSuffix: string;
  previewUrl: string;
}

export const SCENE_TEMPLATES: SceneTemplate[] = [
  {
    id: "minimalist_studio",
    name: "Minimalist Stüdyo",
    description: "Parçalı, temiz ve modern bir stüdyo ortamı.",
    promptSuffix:
      "minimalist professional studio lighting, clean background, sharp focus, 8k resolution, product photography",
    previewUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400",
  },
  {
    id: "nature_outdoor",
    name: "Doğa ve Dış Mekan",
    description: "Ürünü doğal güneş ışığı ve yeşil bir arka planda sergiler.",
    promptSuffix:
      "natural morning sunlight, blurry nature background, forest, plants, soft shadows, cinematic lighting",
    previewUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
  },
  {
    id: "luxury_marble",
    name: "Lüks Mermer",
    description: "Lüks ve elit bir sunum için mermer yüzey ve loş ışık.",
    promptSuffix: "luxury white marble surface, dark elegant background, warm bokeh lightning, premium feel, 4k",
    previewUrl: "https://images.unsplash.com/photo-1504198453319-5ce911baf2ef?w=400",
  },
  {
    id: "home_office",
    name: "Ev ve Ofis",
    description: "Ürünü gerçekçi bir masa veya yaşam alanı senaryosuna yerleştirir.",
    promptSuffix: "modern desk setup, home office background, cozy atmosphere, realistic workspace, apple aesthetic",
    previewUrl: "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=400",
  },
  {
    id: "paris_street",
    name: "Paris Sokakları",
    description: "Parisin şık ve moda dolu sokakları.",
    promptSuffix: "paris street background, eiffel tower in distance, chic fashion atmosphere, daylight, cobblestone",
    previewUrl: "https://images.unsplash.com/photo-1502602898657-3e917247a383?w=400",
  },
  {
    id: "future_city",
    name: "Fütüristik Şehir",
    description: "Neon ışıklar ve yüksek teknoloji binaları.",
    promptSuffix: "cyberpunk city background, neon lights, rainy night, futuristic architecture, sharp contrast",
    previewUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400",
  },
  {
    id: "tropical_beach",
    name: "Tropikal Sahil",
    description: "Altın kumlar ve masmavi bir deniz.",
    promptSuffix: "tropical beach background, palm trees, turquoise water, bright sunny day, vacation vibe",
    previewUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
  },
];

export interface GeneratedScene {
  imageUrl: string;
  prompt: string;
  templateId: string;
}

/**
 * Generates a marketing visual for a product.
 * In a real-world scenario, this would send a prompt to DALL-E 3 or Midjourney.
 */
export async function generateProductScene(
  productName: string,
  templateId: string,
  originalImageUrl?: string,
): Promise<GeneratedScene> {
  const template = SCENE_TEMPLATES.find((t) => t.id === templateId) || SCENE_TEMPLATES[0];

  // 1. Use Gemini to refine the prompt based on the product name and template
  const promptRefinement = await generateGeminiReply({
    message: `You are a professional prompt engineer for Stable Diffusion and Midjourney.
    
    Ürün: ${productName}. Tema: ${template.name}. 
    Bu ürün için profesyonel bir ürün fotoğrafçılığı "text-to-image" prompt'u hazırla. 
    Sadece prompt'u (İngilizce) döndür.`,
    locale: "en",
  });

  const finalPrompt = `${promptRefinement || productName}, ${template.promptSuffix}`;

  // 2. Simulate image generation.
  // In demo mode, we return high-quality stock images that look like the theme.
  const mockImages: Record<string, string> = {
    minimalist_studio: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000",
    nature_outdoor: "https://images.unsplash.com/photo-1526170315870-ef6876b84194?q=80&w=1000",
    luxury_marble: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=1000",
    home_office: "https://images.unsplash.com/photo-1583394838336-acd977730f90?q=80&w=1000",
  };

  return {
    imageUrl: mockImages[templateId] || mockImages["minimalist_studio"],
    prompt: finalPrompt,
    templateId,
  };
}
