
import { GoogleGenAI } from "@google/genai";
import type { DistanceResult } from "../types";

/**
 * Extrai o valor numérico de uma string, procurando por padrões como "VALOR: 217" ou "217 km"
 */
const extractDistance = (text: string | undefined): number | null => {
  if (!text) return null;
  
  // Remove formatação comum e substitui vírgula por ponto
  const cleaned = text.replace(/\s+/g, ' ').replace(',', '.');
  
  // Tenta encontrar o padrão VALOR: X.X primeiro (mais preciso)
  const explicitMatch = cleaned.match(/VALOR:\s*(\d+(\.\d+)?)/i);
  if (explicitMatch) {
    return parseFloat(explicitMatch[1]);
  }

  // Fallback: procura por qualquer número seguido ou precedido por indicadores de distância
  const distanceMatch = cleaned.match(/(\d+(\.\d+)?)\s*(km|quilômetros|quilometros)/i);
  if (distanceMatch) {
    return parseFloat(distanceMatch[1]);
  }

  // Última tentativa: pega o primeiro número que aparecer
  const firstNumMatch = cleaned.match(/(\d+(\.\d+)?)/);
  if (firstNumMatch) {
    const val = parseFloat(firstNumMatch[0]);
    return val > 0 ? val : null;
  }

  return null;
};

export const getDistance = async (origin: string, destination: string): Promise<DistanceResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Erro: API_KEY não configurada no ambiente.");
    return { distance: null, sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  const systemInstruction = `Você é um especialista em logística e geografia de Minas Gerais, Brasil. 
Sua tarefa é fornecer a distância rodoviária exata entre dois pontos. 
Sempre formate sua resposta final iniciando com "VALOR: " seguido apenas do número em km.`;

  const userPrompt = `Calcule a distância rodoviária aproximada entre "${origin}" e "${destination}".
Considere que ambos os locais estão em Minas Gerais ou estados vizinhos.
Se o destino for uma cidade, considere o centro dela.
Responda no formato: VALOR: [número]`;

  try {
    console.log(`[Gemini] Iniciando busca de rota: ${origin} -> ${destination}`);
    
    // TENTATIVA 1: Com Google Search e Thinking
    const response = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2000 },
        temperature: 0.1,
      },
    });

    let distance = extractDistance(response.text);
    const sources: { title: string; uri: string }[] = [];
    
    // Extrair fontes de fundamentação
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    if (distance !== null) {
      console.log(`[Gemini] Sucesso na busca: ${distance}km`);
      return { distance, sources };
    }

    // TENTATIVA 2: Fallback sem Search (Conhecimento Interno) se a busca falhou
    console.log("[Gemini] Fallback: Tentando sem ferramentas de busca...");
    const fallbackResponse = await ai.models.generateContent({
      model: modelName,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0,
      },
    });

    distance = extractDistance(fallbackResponse.text);
    if (distance !== null) {
      console.log(`[Gemini] Sucesso no fallback: ${distance}km`);
      return { distance, sources: [] };
    }

  } catch (error) {
    console.error("Erro crítico na API Gemini:", error);
  }

  return { distance: null, sources: [] };
};
