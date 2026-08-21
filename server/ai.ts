import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

function getAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function analyzePrescriptionOrMedicine(params: {
  prompt: string;
  imageBase64?: string;
  imageMimeType?: string;
}): Promise<string> {
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
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.2,
      }
    });

    return response.text || 'Não foi possível extrair informações no momento.';
  } catch (err: any) {
    console.error('Gemini AI error:', err);
    return `Erro ao consultar assistente de IA: ${err.message || 'Falha temporária'}`;
  }
}
