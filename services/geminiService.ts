
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

  // Model gemini-2.5-flash is required for googleMaps tool
  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  // Verifica se a origem são coordenadas GPS
  const isCoords = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(origin.trim());
  let toolConfig = undefined;

  if (isCoords) {
    const [lat, lng] = origin.split(',').map(v => parseFloat(v.trim()));
    if (!isNaN(lat) && !isNaN(lng)) {
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: lat,
            longitude: lng
          }
        }
      };
    }
  }

  const prompt = `Aja como um despachante de táxi no Brasil.
Sua missão é fornecer a DISTÂNCIA RODOVIÁRIA exata utilizando o GOOGLE MAPS.

ORIGEM: ${origin}
DESTINO: ${destination}

Instruções:
1. Utilize obrigatoriamente a ferramenta Google Maps para encontrar a rota de carro mais eficiente.
2. Identifique a distância total do trajeto em quilômetros.
3. Se houver mais de uma rota, use a principal recomendada pelo Google Maps.
4. Sua resposta DEVE terminar com o formato: RESULT_KM: [número]

Considere o contexto geográfico brasileiro para nomes de cidades e locais.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }, { googleSearch: {} }],
        toolConfig: toolConfig,
        temperature: 0.1,
      },
    });

    const textOutput = response.text || "";
    const distance = extractDistance(textOutput);
    
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        // Handle Maps grounding
        if (chunk.maps?.uri) {
          sources.push({ 
            title: chunk.maps.title || "Ver no Google Maps", 
            uri: chunk.maps.uri 
          });
        } 
        // Handle Search grounding
        else if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    if (distance === null) {
      // Fallback simples sem ferramentas se o grounding falhar
      const fallback = await ai.models.generateContent({
        model: modelName,
        contents: `Qual a distância rodoviária em km de ${origin} para ${destination}? Responda apenas o número.`,
      });
      return { distance: extractDistance(fallback.text), sources };
    }

    return { distance, sources };

  } catch (error) {
    console.error("Erro no serviço de mapas/Gemini:", error);
    return { distance: null, sources: [] };
  }
};
