
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const extractDistance = (text: string | undefined): number | null => {
    if (!text) return null;
    const sanitizedText = text.replace(',', '.');
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
  const model = 'gemini-2.5-flash';
  
  const basePrompt = `Tarefa: Calcular a distância de carro (em km) entre "${origin}" e "${destination}".
  Contexto: Minas Gerais, Brasil.
  
  Instruções Críticas:
  1. O objetivo é obter um valor numérico para cálculo de frete.
  2. Se houver ambiguidade no nome da cidade, assuma que é em Minas Gerais.
  3. Se não encontrar um endereço exato, use o centro da cidade.
  4. PRIORIDADE: Retorne APENAS o número (ex: 150.5). Sem texto adicional.`;

  // Tentativa 1: Usar Google Search (Mais preciso)
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: basePrompt + "\nUse o Google Search para encontrar a distância rodoviária atualizada.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });
    
    const distance = extractDistance(response.text?.trim());
    if (distance) return distance;

  } catch (error: any) {
    // Se der erro (ex: 403 Permission Denied ou 400), fazemos fallback
    console.warn("Erro ao usar Google Search (Tentativa 1). Tentando fallback para conhecimento interno.", error);
  }

  // Tentativa 2: Fallback para conhecimento interno do modelo (Sem tools)
  try {
      const response = await ai.models.generateContent({
        model: model,
        contents: basePrompt + "\nEstime a distância com base no seu conhecimento geográfico interno.",
        config: {
            temperature: 0.1,
            // Sem tools para evitar erro de permissão
        },
      });

      const distance = extractDistance(response.text?.trim());
      if (distance) return distance;
      
      console.error("Não foi possível extrair a distância da resposta de fallback:", response.text);
  } catch (error) {
      console.error("Erro fatal ao chamar API Gemini (Fallback):", error);
  }

  return null;
};
