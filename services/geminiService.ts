import { GoogleGenAI, Type } from "@google/genai";
import type { OptimizedAdResponse } from '../types';

// Assume process.env.API_KEY is available
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const adOptimizationSchema = {
    type: Type.OBJECT,
    properties: {
        optimizedTitle: {
            type: Type.STRING,
            description: "O título do anúncio, reescrito para ser curto, cativante e de alto impacto.",
        },
        optimizedDescription: {
            type: Type.STRING,
            description: "O texto principal do anúncio (descrição), completamente reescrito e otimizado para persuasão, clareza e com uma forte chamada para ação (CTA).",
        },
        improvements: {
            type: Type.ARRAY,
            description: "Uma lista de pontos de destaque da criação, explicando por que os elementos do anúncio otimizado são eficazes.",
            items: {
                type: Type.STRING,
            },
        },
        persuasionScore: {
            type: Type.STRING,
            description: "Uma avaliação do nível de persuasão do anúncio otimizado. Valores possíveis: 'Alto', 'Médio', 'Baixo'."
        },
        clarityScore: {
            type: Type.STRING,
            description: "Uma nota sobre a clareza geral do anúncio otimizado. Valores possíveis: 'Excelente', 'Bom', 'A Melhorar'."
        },
        imageSuggestion: {
            type: Type.STRING,
            description: "Uma recomendação estratégica para a imagem do anúncio. Descreva o tipo de imagem que seria mais eficaz (ex: 'Close-up do produto em um fundo neutro', 'Pessoa sorrindo enquanto usa o serviço')."
        }
    },
    required: ["optimizedTitle", "optimizedDescription", "improvements", "persuasionScore", "clarityScore", "imageSuggestion"],
};

export const optimizeAd = async (productUrl: string): Promise<OptimizedAdResponse> => {
    try {
        const prompt = `
            Você é um especialista em marketing digital e copywriting com anos de experiência em criar anúncios de alta conversão a partir do zero.
            O usuário forneceu apenas a URL de um produto: ${productUrl}.

            Sua tarefa é:
            1.  **Analisar a URL:** Inferir qual é o produto e seu público-alvo a partir da URL.
            2.  **Criar um Título Otimizado:** Crie um título magnético, curto, e de alto impacto para este produto.
            3.  **Criar uma Descrição Otimizada:** Escreva uma descrição de anúncio completamente nova e otimizada. O texto deve ser altamente persuasivo, claro, destacar os principais benefícios e terminar com uma forte chamada para ação (CTA).
            4.  **Sugerir a Imagem Ideal:** Baseado na sua inferência sobre o produto, forneça uma SUGESTÃO ESTRATÉGICA sobre o tipo de imagem que teria o melhor desempenho para este anúncio. Seja descritivo (ex: "Uma foto de alta qualidade mostrando o produto em uso por uma pessoa feliz", "Um gráfico limpo destacando o principal benefício", etc.).
            5.  **Listar Pontos de Destaque:** Em vez de listar melhorias sobre um texto original, liste os 'Pontos de Destaque' da sua criação, explicando por que os elementos que você criou (título, CTA, etc.) são eficazes.
            6.  **Avaliar a Criação:** Forneça um 'Nível de Persuasão' (Alto, Médio ou Baixo) e uma 'Nota de Clareza' (Excelente, Bom, A Melhorar) para o anúncio que você criou.

            URL do Produto para Análise:
            ---
            "${productUrl}"
            ---

            Gere uma resposta JSON estruturada com os campos solicitados.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: adOptimizationSchema,
                temperature: 0.7,
            },
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);

        if (
            result && 
            typeof result.optimizedTitle === 'string' &&
            typeof result.optimizedDescription === 'string' &&
            Array.isArray(result.improvements) &&
            typeof result.persuasionScore === 'string' &&
            typeof result.clarityScore === 'string' &&
            typeof result.imageSuggestion === 'string'
        ) {
             return result as OptimizedAdResponse;
        } else {
            throw new Error("Resposta da API em formato inesperado.");
        }

    } catch (error) {
        console.error("Erro ao otimizar anúncio:", error);
        throw new Error("Não foi possível otimizar o anúncio. Tente novamente mais tarde.");
    }
};