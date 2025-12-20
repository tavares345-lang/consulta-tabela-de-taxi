
import { GoogleGenAI } from "@google/genai";

/**
 * Função segura para obter a chave de API sem quebrar a execução global
 */
const getApiKey = () => {
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

const extractDistance = (text: string | undefined): number | null => {
    if (!text) return null;
    const sanitizedText = text.replace(',', '.');
    // Busca o primeiro número na resposta
    const distanceMatch = sanitizedText.match(/(\d+(\.\d+)?)/);
    if (distanceMatch) {
        const distance = parseFloat(distanceMatch[0]);
        if (!isNaN(distance) && distance > 0) {
            return distance;
        }
    }
    return null;
};

export const getDistance = async (origin: string, destination: string): Promise<number | null> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("API_KEY não disponível.");
    return null;
  }

  // Usando gemini-3-flash-preview para melhor performance e custo
  const modelName = 'gemini-3-flash-preview';
  
  const basePrompt = `Calcule a distância rodoviária exata de carro entre "${origin}" e "${destination}" em Minas Gerais, Brasil.
  
  IMPORTANTE:
  - Se um local não for encontrado, tente o centro da cidade correspondente.
  - Retorne APENAS o número da distância em km (ex: 45.3).
  - NUNCA retorne texto, explicações ou avisos. Apenas o número puro.`;

  // Tentativa 1: Google Search
  try {
    console.log(`Buscando distância via Gemini Search: ${origin} -> ${destination}`);
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: basePrompt + "\nUse a ferramenta de busca do Google para confirmar a distância oficial.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0,
      },
    });
    
    const distance = extractDistance(response.text?.trim());
    if (distance) {
        console.log(`Distância obtida via Search: ${distance}km`);
        return distance;
    }

  } catch (error: any) {
    console.warn("Falha na tentativa 1 (Search):", error?.message || error);
  }

  // Tentativa 2: Fallback (Conhecimento Interno)
  try {
      console.log("Tentando fallback via conhecimento geográfico interno...");
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: basePrompt + "\nUtilize seu conhecimento interno sobre a malha rodoviária de Minas Gerais.",
        config: {
            temperature: 0,
        },
      });

      const distance = extractDistance(response.text?.trim());
      if (distance) {
          console.log(`Distância obtida via Fallback: ${distance}km`);
          return distance;
      }
  } catch (error) {
      console.error("Erro total na API Gemini:", error);
  }

  return null;
};
