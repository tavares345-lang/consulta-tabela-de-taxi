
import { GoogleGenAI } from "@google/genai";
import type { DistanceResult } from "../types";

const extractDistance = (text: string | undefined): number | null => {
  if (!text) return null;
  const sanitizedText = text.replace(',', '.');
  const distanceMatch = sanitizedText.match(/(\d+(\.\d+)?)/);
  if (distanceMatch) {
    const distance = parseFloat(distanceMatch[0]);
    return !isNaN(distance) && distance > 0 ? distance : null;
  }
  return null;
};

export const getDistance = async (origin: string, destination: string): Promise<DistanceResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { distance: null, sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  const basePrompt = `Tarefa: Calcular a distância rodoviária (em km) para uma viagem de táxi.
Origem: "${origin}"
Destino: "${destination}"
Contexto: Região Metropolitana de Belo Horizonte e interior de Minas Gerais, Brasil.

Instruções:
1. Use o Google Search para encontrar a distância rodoviária mais provável entre esses dois pontos.
2. Retorne APENAS o número da distância (ex: 42.5). Não inclua km ou textos adicionais.
3. Se o destino for um bairro ou hotel, considere o endereço exato em Minas Gerais.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: basePrompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });

    const distance = extractDistance(response.text?.trim());
    
    // Extrair fontes de fundamentação (Obrigatório conforme diretrizes)
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { distance, sources };

  } catch (error) {
    console.error("Erro na busca de distância Gemini:", error);
    return { distance: null, sources: [] };
  }
};
