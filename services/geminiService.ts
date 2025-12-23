
import { GoogleGenAI } from "@google/genai";
import type { DistanceResult } from "../types";

/**
 * Extrai o valor numérico de uma string de forma extremamente agressiva.
 */
const extractDistance = (text: string | undefined): number | null => {
  if (!text) return null;
  
  // Normaliza o texto: remove espaços extras, troca vírgula por ponto
  const normalized = text.replace(/\s+/g, ' ').replace(',', '.');
  
  // 1. Procura por um padrão explícito definido no prompt
  const explicitMatch = normalized.match(/RESULT_KM:\s*(\d+(\.\d+)?)/i);
  if (explicitMatch) return parseFloat(explicitMatch[1]);

  // 2. Procura por "X km" ou "X quilômetros"
  const kmMatch = normalized.match(/(\d+(\.\d+)?)\s*(km|quil[ôo]metros)/i);
  if (kmMatch) return parseFloat(kmMatch[1]);

  // 3. Procura por qualquer número que pareça uma distância razoável
  const allNumbers = normalized.match(/(\d+(\.\d+)?)/g);
  if (allNumbers) {
    const candidates = allNumbers.map(n => parseFloat(n)).filter(n => n > 0 && n < 5000);
    if (candidates.length > 0) return candidates[0];
  }

  return null;
};

export const getDistance = async (origin: string, destination: string): Promise<DistanceResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Erro: API_KEY não encontrada.");
    return { distance: null, sources: [] };
  }

  // Criamos a instância aqui para garantir o uso da chave mais atual
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  // Verifica se é coordenada para formatar a query de busca adequadamente
  const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(origin.trim());
  const formattedOrigin = isCoords ? `coordenadas geográficas ${origin}` : origin;

  const prompt = `Aja como um assistente de logística de táxi no Brasil.
Sua tarefa é encontrar a distância rodoviária (por estrada, de carro) entre:
ORIGEM: ${formattedOrigin}
DESTINO: ${destination}

Instruções críticas:
1. Use a busca do Google para encontrar a rota real por estradas brasileiras.
2. Se a origem for coordenadas, identifique o local correspondente.
3. Considere sempre a distância em QUILÔMETROS (KM).
4. O valor final deve ser o trajeto mais comum para veículos.
5. Sua resposta deve terminar obrigatoriamente com: RESULT_KM: [número]

Responda em Português do Brasil.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 2000 },
        temperature: 0.1,
      },
    });

    const textOutput = response.text || "";
    const distance = extractDistance(textOutput);
    
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Fallback caso a busca falhe
    if (distance === null) {
      const fallback = await ai.models.generateContent({
        model: modelName,
        contents: `Qual a distância em km por estrada de ${origin} para ${destination}? Responda apenas o número.`,
      });
      return { distance: extractDistance(fallback.text), sources };
    }

    return { distance, sources };

  } catch (error) {
    console.error("Erro no serviço de distância:", error);
    return { distance: null, sources: [] };
  }
};
