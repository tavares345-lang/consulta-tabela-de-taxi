
import { GoogleGenAI } from "@google/genai";
import type { DistanceResult } from "../types";

/**
 * Extrai o valor numérico de uma string de forma ultra-flexível.
 */
const extractDistance = (text: string | undefined): number | null => {
  if (!text) return null;
  
  // Normaliza o texto: remove espaços, troca vírgula por ponto
  const normalized = text.replace(/\s+/g, ' ').replace(',', '.');
  
  // 1. Tenta encontrar o padrão RESULT_KM: [numero]
  const explicitMatch = normalized.match(/RESULT_KM:\s*(\d+(\.\d+)?)/i);
  if (explicitMatch) return parseFloat(explicitMatch[1]);

  // 2. Tenta encontrar qualquer número seguido de km ou quilometros
  const kmMatch = normalized.match(/(\d+(\.\d+)?)\s*(km|quil[ôo]metros)/i);
  if (kmMatch) return parseFloat(kmMatch[1]);

  // 3. Fallback: pega o primeiro número que aparecer na resposta que não seja 0
  const anyNumber = normalized.match(/(\d+(\.\d+)?)/);
  if (anyNumber) return parseFloat(anyNumber[1]);

  return null;
};

export const getDistance = async (origin: string, destination: string): Promise<DistanceResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("Erro: API_KEY não encontrada.");
    return { distance: null, sources: [] };
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelName = 'gemini-2.5-flash';

  // Adiciona contexto regional para melhorar a precisão no Brasil/MG
  const originCtx = origin.toLowerCase().includes("brasil") ? origin : `${origin}, Minas Gerais, Brasil`;
  const destCtx = destination.toLowerCase().includes("brasil") ? destination : `${destination}, Minas Gerais, Brasil`;

  const prompt = `Você é um assistente de logística de táxi.
Sua missão: Fornecer a distância RODoviária de CARRO entre dois pontos usando o Google Maps.

ORIGEM: ${originCtx}
DESTINO: ${destCtx}

REGRAS CRÍTICAS:
1. Use a ferramenta Google Maps para encontrar a distância real de condução.
2. Ignore distâncias aéreas (linha reta).
3. Considere a rota principal/mais rápida.
4. Responda APENAS o resultado final no formato abaixo, sem texto adicional.

FORMATO DA RESPOSTA:
RESULT_KM: [valor numérico]`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
        temperature: 0.1, // Baixa temperatura para precisão
      },
    });

    const textOutput = response.text || "";
    let distance = extractDistance(textOutput);
    
    const sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps?.uri) {
          sources.push({ 
            title: chunk.maps.title || "Abrir no Google Maps", 
            uri: chunk.maps.uri 
          });
        }
      });
    }

    // Se falhou com a ferramenta, tenta uma busca textual direta como fallback
    if (distance === null) {
      const fallbackResponse = await ai.models.generateContent({
        model: modelName,
        contents: `Qual a distância de estrada (km) entre ${origin} e ${destination}? Responda apenas o número.`,
      });
      distance = extractDistance(fallbackResponse.text);
    }

    return { distance, sources };

  } catch (error) {
    console.error("Erro no serviço de mapas:", error);
    return { distance: null, sources: [] };
  }
};
