
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
  const allNumbers = normalized.match(/(\d+(\.\d+)?)/g);
  if (allNumbers) {
    const candidates = allNumbers.map(n => parseFloat(n)).filter(n => n > 0);
    if (candidates.length > 0) {
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

  // Se a origem parecer coordenadas (lat, lng), não adicionamos Brasil para não confundir o search
  const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(origin.trim());
  const queryOrigin = isCoords ? origin : (origin.toLowerCase().includes("brasil") ? origin : `${origin}, Brasil`);
  const queryDest = destination.toLowerCase().includes("brasil") ? destination : `${destination}, Brasil`;

  const prompt = `Instructions:
1. Use Google Search to find the road distance between "${queryOrigin}" and "${queryDest}".
2. The origin might be geographical coordinates (latitude, longitude).
3. Look for the shortest or most common driving route for cars/taxis.
4. Your output MUST end with the string "RESULT_KM: [number]" where [number] is the distance in kilometers.
5. Provide a brief reasoning for the distance found.

Context: Taxi trip calculation in Brazil.
Format:
Reasoning: [your thought process]
RESULT_KM: [number]`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
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

    if (distance === null) {
      console.warn("[Gemini] Falha ao extrair distância com busca. Tentando conhecimento interno...");
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Qual a distância rodoviária aproximada entre ${origin} e ${destination} no Brasil? Responda apenas o número em km.`,
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
