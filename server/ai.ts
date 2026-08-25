import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

// Server-side in-memory cache to save tokens and minimize latency
interface ServerAiCacheItem {
  answer: string;
  timestamp: number;
}
const serverAiCache = new Map<string, ServerAiCacheItem>();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

function normalizePrompt(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export async function analyzePrescriptionOrMedicine(params: {
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<string> {
  // Check server cache first
  const cacheKey = params.imageBase64
    ? `img_${params.imageBase64.length}_${normalizePrompt(params.prompt)}`
    : `txt_${normalizePrompt(params.prompt)}`;

  const cached = serverAiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.answer;
  }

  const ai = getAi();
  if (!ai) {
    return 'Assistente IA não configurado. Adicione sua chave GEMINI_API_KEY no painel de configurações para obter análise inteligente de receitas médicas e bulas.';
  }

  try {
    const systemInstruction = `Você é o Assistente Especialista de Saúde e Medicamentos do aplicativo "Seu Horário do Remédio".
Sua função é auxiliar o usuário a organizar seus horários de medicamentos, entender receitas médicas, instruções de bula, doses e precauções alimentares/horárias.
Sempre responda em Português do Brasil com linguagem clara, acolhedora, objetiva e formatada com tópicos.
IMPORTANTE: Sempre inclua um aviso ético de que suas orientações não substituem o diagnóstico ou prescrição médica presencial.`;

    let contents: any[] = [];

    if (params.imageBase64 && params.imageMimeType) {
      contents.push({
        inlineData: {
          data: params.imageBase64,
          mimeType: params.imageMimeType,
        }
      });
    }

    contents.push(params.prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    const result = response.text || 'Não foi possível extrair informações no momento.';

    // Cache valid responses
    if (result && !result.startsWith('Erro')) {
      serverAiCache.set(cacheKey, { answer: result, timestamp: Date.now() });
      if (serverAiCache.size > 500) {
        const firstKey = serverAiCache.keys().next().value;
        if (firstKey) serverAiCache.delete(firstKey);
      }
    }

    return result;
  } catch (err: any) {
    console.error('Gemini AI error:', err);
    return `Erro ao consultar assistente de IA: ${err.message || 'Falha temporária'}`;
  }
}

