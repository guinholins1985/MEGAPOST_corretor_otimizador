import { GoogleGenAI } from "@google/genai";
import type { OptimizedAdResponse, GroundingSource } from '../types';

// Helper to safely parse JSON from a string that might contain other text
function extractAndParseJson(text: string): any {
    let jsonString = text.trim();

    // 1. Try to find a JSON blob inside markdown ```json ... ```
    const markdownMatch = jsonString.match(/```json\n([\s\S]*?)\n```/);
    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
    } else {
        // 2. If no markdown, find the first '{' and last '}'
        const firstBracket = jsonString.indexOf('{');
        const lastBracket = jsonString.lastIndexOf('}');
        if (firstBracket !== -1 && lastBracket > firstBracket) {
            jsonString = jsonString.substring(firstBracket, lastBracket + 1);
        }
    }

    try {
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from response. Raw text:", text);
        console.error("Attempted to parse:", jsonString);
        // The error will be caught by the calling function's catch block
        throw new Error("A resposta da IA não estava em um formato JSON válido.");
    }
}

export const optimizeAd = async (productUrl: string): Promise<OptimizedAdResponse> => {
    // This check is important. If it fails, the app won't even try to call the API.
    // On Vercel, env vars must be configured in the project settings.
    if (!process.env.API_KEY) {
        throw new Error("A chave de API do Google não foi encontrada. Configure a variável de ambiente API_KEY nas configurações do seu projeto Vercel.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const prompt = `
            Você é um especialista em marketing digital e copywriting. Sua tarefa é analisar a URL de um produto, pesquisar na web para entendê-lo e, em seguida, criar um anúncio completo e otimizado.

            URL para Análise: "${productUrl}"

            Siga estes passos:
            1.  **Pesquisa:** Use a busca para entender o produto, seus benefícios e público-alvo.
            2.  **Criação:** Com base na pesquisa, crie um "Título Otimizado" e uma "Descrição Otimizada". O texto deve ser persuasivo, claro e com uma chamada para ação (CTA).
            3.  **Sugestão de Imagem:** Descreva uma "Sugestão de Imagem" ideal para o anúncio.
            4.  **Pontos de Destaque:** Liste os "Pontos de Destaque" da sua otimização, explicando por que as escolhas são eficazes.
            5.  **Avaliação:** Forneça um "Nível de Persuasão" (Alto, Médio, Baixo) e uma "Nota de Clareza" (Excelente, Bom, A Melhorar).

            **Formato de Saída OBRIGATÓRIO:**
            Sua resposta DEVE ser APENAS um objeto JSON válido, sem nenhum texto ou formatação antes ou depois, com a seguinte estrutura:
            {
              "optimizedTitle": "string",
              "optimizedDescription": "string",
              "improvements": ["string"],
              "persuasionScore": "string",
              "clarityScore": "string",
              "imageSuggestion": "string"
            }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.2, // Lower temperature for more predictable, structured output.
            },
        });

        const result = extractAndParseJson(response.text);

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        const sources: GroundingSource[] = groundingMetadata?.groundingChunks
            ?.map((chunk: any) => chunk.web && { uri: chunk.web.uri, title: chunk.web.title })
            .filter((source: any): source is GroundingSource => source && source.uri) || [];

        // Validate the structure of the parsed JSON
        if (
            result && 
            typeof result.optimizedTitle === 'string' &&
            typeof result.optimizedDescription === 'string' &&
            Array.isArray(result.improvements) &&
            typeof result.persuasionScore === 'string' &&
            typeof result.clarityScore === 'string' &&
            typeof result.imageSuggestion === 'string'
        ) {
             return { ...result, sources };
        } else {
            console.error("JSON recebido da API não possui a estrutura esperada.", result);
            throw new Error("A resposta da IA, embora seja um JSON válido, não contém os campos esperados.");
        }

    } catch (error) {
        console.error("Erro ao chamar a API Gemini:", error);
        if (error instanceof Error) {
            // Re-throw specific, user-friendly messages
            if (error.message.includes("JSON")) {
                 throw new Error("A resposta da IA não estava no formato JSON esperado e não pôde ser lida.");
            }
            // For other errors, provide a general message
            throw new Error("Não foi possível otimizar o anúncio. Verifique a URL ou a configuração da sua chave de API.");
        }
        // Fallback for non-Error objects
        throw new Error("Ocorreu um erro desconhecido ao contatar o serviço de IA.");
    }
};