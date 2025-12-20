
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
    console.error("Gemini API Key não encontrada em process.env.API_KEY. O cálculo de rota será desabilitado.");
    return null;
  }

  // Modelo recomendado para tarefas de texto/busca
  const modelName = 'gemini-3-flash-preview';
  
  const basePrompt = `Tarefa: Calcular a distância de carro (em km) entre "${origin}" e "${destination}".
  Contexto: Minas Gerais, Brasil.
  
  Instruções Críticas:
  1. O objetivo é obter um valor numérico para cálculo de frete.
  2. Se houver ambiguidade no nome da cidade, assuma que é em Minas Gerais (Brasil).
  3. Se não encontrar um endereço exato, use o centro da cidade ou ponto de referência.
  4. PRIORIDADE: Retorne APENAS o número (ex: 150.5). Sem texto adicional, sem unidade "km".`;

  // Tentativa 1: Usar Google Search (Maior precisão para rotas reais)
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: basePrompt + "\nUse o Google Search para encontrar a distância rodoviária exata e atualizada.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });
    
    const distance = extractDistance(response.text?.trim());
    if (distance) return distance;

  } catch (error: any) {
    console.warn("Aviso: Falha ao usar Google Search para distância. Tentando fallback interno.", error);
  }

  // Tentativa 2: Fallback para o conhecimento geográfico interno do modelo
  try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: modelName,
        contents: basePrompt + "\nEstime a distância rodoviária aproximada com base no seu conhecimento de mapas e rotas de Minas Gerais.",
        config: {
            temperature: 0.1,
        },
      });

      const distance = extractDistance(response.text?.trim());
      if (distance) return distance;
      
      console.error("Não foi possível extrair um número válido da resposta do Gemini:", response.text);
  } catch (error) {
      console.error("Erro fatal ao chamar a API Gemini:", error);
  }

  return null;
};
