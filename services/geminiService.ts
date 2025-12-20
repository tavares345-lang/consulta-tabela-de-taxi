
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

  // 3. Procura por qualquer número que pareça uma distância razoável (evitando anos ou números pequenos demais)
  // Tentamos pegar o número mais "isolado" ou proeminente
  const allNumbers = normalized.match(/(\d+(\.\d+)?)/g);
  if (allNumbers) {
    // Filtramos números que podem ser anos (1900-2100) ou muito pequenos, 
    // a menos que seja o único número
    const candidates = allNumbers.map(n => parseFloat(n)).filter(n => n > 0);
    if (candidates.length > 0) {
      // Se houver "RESULT_KM" no texto original mas o regex falhou, o número pode estar lá
      // Caso contrário, pegamos o primeiro número > 0
      return candidates[0];
    }
  }

  return null;
};

export const getDistance = async (origin: string, destination: string): Promise<DistanceResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Erro: API_KEY não encontrada.");
    return { distance: null, sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-3-flash-preview';

  // Adicionamos "Brasil" para garantir que o Google Search foque na região correta
  const queryOrigin = origin.toLowerCase().includes("brasil") ? origin : `${origin}, Brasil`;
  const queryDest = destination.toLowerCase().includes("brasil") ? destination : `${destination}, Brasil`;

  const prompt = `Instructions:
1. Use Google Search to find the road distance between "${queryOrigin}" and "${queryDest}".
2. Look for the shortest or most common driving route.
3. Your output MUST end with the string "RESULT_KM: [number]" where [number] is the distance in kilometers.
4. If you find multiple distances, use the one for cars/taxis.

Context: Taxi trip in Minas Gerais, Brazil.
Format:
Reasoning: [your thought process]
RESULT_KM: [number]`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // Usamos um budget de pensamento maior para garantir que ele processe os resultados da busca
        thinkingConfig: { thinkingBudget: 4000 },
        temperature: 0.2,
      },
    });

    const textOutput = response.text;
    console.log("[Gemini Response]:", textOutput);
    
    const distance = extractDistance(textOutput);
    
    const sources: { title: string; uri: string }[] = [];
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const groundingChunks = groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Se falhou com search, tentamos uma última vez sem search (conhecimento interno do modelo)
    if (distance === null) {
      console.warn("[Gemini] Falha ao extrair distância com busca. Tentando conhecimento interno...");
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Qual a distância rodoviária aproximada entre ${origin} e ${destination} em Minas Gerais? Responda apenas o número em km.`,
        config: { temperature: 0 }
      });
      const fallbackDistance = extractDistance(fallbackResponse.text);
      return { distance: fallbackDistance, sources };
    }

    return { distance, sources };

  } catch (error) {
    console.error("Erro no getDistance:", error);
    return { distance: null, sources: [] };
  }
};
