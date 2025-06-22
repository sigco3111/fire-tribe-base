import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME, IMAGEN_MODEL_NAME, PROGRESS_STATUS_LABELS, AI_COACHING_PROMPT_TYPE_LABELS } from '../constants';
import { IdeaCategory, ImpactLevel, EffortLevel, AIGeneratedIdeaSeed, Idea, AICoachingPromptType, AICoachingSession, ProgressStatus, GroundingChunk } from '../types';

const GENERIC_API_KEY_ERROR_MESSAGE = "Gemini API를 사용하려면 유효한 API 키가 필요합니다. 환경 변수를 확인하거나 앱 내 설정을 통해 API 키를 입력해주세요.";

const getAIInstance = (apiKey: string): GoogleGenAI => {
  if (!apiKey || apiKey.trim() === "") {
    console.error("API Key is missing or empty for GoogleGenAI initialization.");
    throw new Error(GENERIC_API_KEY_ERROR_MESSAGE);
  }
  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    throw new Error(`GoogleGenAI 초기화 실패: ${error instanceof Error ? error.message : String(error)}. API 키 설정을 확인해주세요.`);
  }
};


export const generateIdeasWithGemini = async (apiKey: string, userInput: string): Promise<AIGeneratedIdeaSeed[]> => {
  const ai = getAIInstance(apiKey);

  const categories = Object.values(IdeaCategory).join('", "');
  const impacts = Object.values(ImpactLevel).join('", "');
  const efforts = Object.values(EffortLevel).join('", "');

  const prompt = `
    You are an AI assistant for "FIRE Tribe Base," a platform helping users achieve Financial Independence, Retire Early (FIRE).
    The user is looking for ideas related to: "${userInput}".
    
    Generate 3 diverse and actionable ideas. For each idea, provide:
    1. title: (string, concise and engaging, max 10 words)
    2. category: (string, must be one of: "${categories}")
    3. description: (string, 1-3 sentences explaining the core concept and its relevance to FIRE)
    4. potentialImpact: (string, must be one of: "${impacts}") - relative to FIRE goals.
    5. effortLevel: (string, must be one of: "${efforts}") - initial effort to get started.
    6. initialSteps: (array of 2-4 strings, actionable first steps a user can take)
    7. refinementPrompts: (array of 2-3 strings, insightful questions to help the user elaborate on this idea and tailor it to their situation)

    Return the response as a JSON array of objects. Each object must strictly follow this structure:
    {
      "title": "예시 아이디어 제목",
      "category": "${IdeaCategory.INCOME_GENERATION}", 
      "description": "아이디어에 대한 간략한 설명입니다.",
      "potentialImpact": "Medium",
      "effortLevel": "Medium",
      "initialSteps": ["첫 번째 단계", "두 번째 단계", "세 번째 단계"],
      "refinementPrompts": ["질문 1?", "질문 2?"]
    }

    IMPORTANT JSON FORMATTING RULES:
    - The entire response MUST be a single, valid JSON array.
    - The response must start with '[' and end with ']'. Do not include any text or markdown formatting (like \`\`\`json) outside of this JSON array.
    - Each object in the array represents an idea and must follow the specified structure precisely.
    - All keys and all string values within the JSON must be enclosed in double quotes (e.g., "key": "value"). Single quotes are not allowed.
    - Ensure all special characters within string values (such as double quotes, backslashes, newlines, tabs) are properly escaped (e.g., "a string with a \\"quote\\" and a newline\\n").
    - Array elements (like strings in initialSteps/refinementPrompts, or the idea objects in the main array) must be correctly comma-separated.
    - There should be no trailing comma after the last element in any array or after the last property in any object.
    
    All textual content within the JSON (titles, descriptions, steps, prompts) MUST BE IN KOREAN.
    The category value MUST exactly match one of the provided Korean category names: "${categories}".
    The ideas should be practical and inspiring for someone pursuing FIRE.
    Focus on creativity and concrete actions.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    if (!jsonStr.startsWith('[') || !jsonStr.endsWith(']')) {
        console.warn("Gemini response for idea generation might not be a JSON array:", jsonStr.substring(0,100) + "...");
    }

    const parsedData = JSON.parse(jsonStr);

    if (Array.isArray(parsedData)) {
      return parsedData.filter(item => 
        item &&
        typeof item.title === 'string' &&
        Object.values(IdeaCategory).includes(item.category as IdeaCategory) &&
        typeof item.description === 'string' && 
        Object.values(ImpactLevel).includes(item.potentialImpact as ImpactLevel) &&
        Object.values(EffortLevel).includes(item.effortLevel as EffortLevel) &&
        Array.isArray(item.initialSteps) && item.initialSteps.every((s: any) => typeof s === 'string') &&
        Array.isArray(item.refinementPrompts) && item.refinementPrompts.every((s: any) => typeof s === 'string')
      ) as AIGeneratedIdeaSeed[];
    }
    console.error("Gemini response is not an array or items have incorrect types:", parsedData);
    return [];

  } catch (error) {
    console.error("Error calling Gemini API or parsing response for idea generation:", error);
    let errorMessage = "AI 아이디어 생성에 실패했습니다. ";
    if (error instanceof Error) {
        if (error.name === 'SyntaxError') {
             errorMessage += `잘못된 JSON 형식입니다: ${error.message}`;
        } else if (error.message.includes("API Key") || error.message.toLowerCase().includes("permission denied") || error.message.includes(GENERIC_API_KEY_ERROR_MESSAGE)) {
            errorMessage = GENERIC_API_KEY_ERROR_MESSAGE;
        } else {
            errorMessage += error.message;
        }
    } else {
        errorMessage += "알 수 없는 오류가 발생했습니다.";
    }
    throw new Error(errorMessage);
  }
};

export const generateCoachingPrompt = (
  idea: Pick<Idea, 'title' | 'description' | 'category' | 'initialSteps' | 'userRefinements' | 'tags' | 'status' | 'potentialImpact' | 'effortLevel'>,
  coachingType: AICoachingPromptType,
  existingSessions: AICoachingSession[],
  userSpecificQuestion?: string
): string => {
  let promptHeader = `You are an AI coach for "FIRE Tribe Base," specializing in Financial Independence, Retire Early (FIRE) strategies.
You MUST provide all responses in KOREAN.
The user is seeking coaching for their idea. Here is the current information about the idea:
- Idea Title (아이디어 제목): ${idea.title}
- Category (카테고리): ${idea.category}
- Description (설명): ${idea.description}
- Potential Impact (잠재적 효과): ${idea.potentialImpact}
- Effort Level (필요 노력): ${idea.effortLevel}
- Current Status (현재 상태): ${PROGRESS_STATUS_LABELS[idea.status as ProgressStatus] || idea.status}
- Initial Steps Planned (초기 실행 단계): ${idea.initialSteps.length > 0 ? idea.initialSteps.join('; ') : '지정되지 않음'}
- User Refinements/Notes (사용자 구체화 내용): ${Object.entries(idea.userRefinements).map(([key, value]) => `${key}: ${value}`).join('; ') || '없음'}
- Tags (태그): ${idea.tags.join(', ') || '없음'}
`;

  if (existingSessions.length > 0) {
    promptHeader += "\nPREVIOUS COACHING HISTORY (most recent first):\n";
    existingSessions.slice(0, 5).forEach((session, index) => {
      const promptTypeKorean = AI_COACHING_PROMPT_TYPE_LABELS[session.promptType] || session.promptType;
      let sessionSummary = `--- Session ${existingSessions.length - index} (Type: ${promptTypeKorean}, Timestamp: ${new Date(session.timestamp).toLocaleString('ko-KR')}) ---\n`;
      
      if (session.promptType === AICoachingPromptType.USER_SPECIFIC_QUERY) {
        const userQMatch = session.promptSent.match(/specific question about this idea: "([^"]+)"/i);
        if (userQMatch && userQMatch[1]) {
          sessionSummary += `  User Asked: "${userQMatch[1].substring(0, 150)}${userQMatch[1].length > 150 ? '...' : ''}"\n`;
        } else {
          sessionSummary += `  User initiated a specific query.\n`;
        }
      } else {
         if (session.promptSent) {
           const systemTaskMatch = session.promptSent.match(/Your task is to: (.*?)\nKeep your response/is);
           if(systemTaskMatch && systemTaskMatch[1]){
              sessionSummary += `  AI was asked to: ${systemTaskMatch[1].substring(0,100).replace(/\n+/g, ' ')}...\n`
           }
         }
      }
      
      const aiRespSummary = session.response.substring(0, 200).replace(/\n+/g, ' ');
      sessionSummary += `  AI Responded: "${aiRespSummary}${session.response.length > 200 ? '...' : ''}"\n`;
      promptHeader += sessionSummary;
    });
     promptHeader += "-----------------------------------\n";
  }

  let specificRequest = "";
  switch (coachingType) {
    case AICoachingPromptType.ACTION_PLAN_DETAIL:
      specificRequest = "Based on the idea details, provide a concrete, actionable 5-7 step detailed action plan in KOREAN. Each step should be clear, sequential, and help the user move forward. Focus on practical actions.";
      break;
    case AICoachingPromptType.RISK_ANALYSIS:
      specificRequest = "Analyze the idea and identify 3 key potential risks or challenges the user might face, in KOREAN. For each risk, suggest a brief, actionable mitigation strategy.";
      break;
    case AICoachingPromptType.ALTERNATIVE_PERSPECTIVES:
      specificRequest = "Provide 2-3 alternative perspectives or creative enhancements for this idea, in KOREAN. Think about how the user could expand, simplify, or approach the idea differently to improve its FIRE potential.";
      break;
    case AICoachingPromptType.USER_SPECIFIC_QUERY:
      if (userSpecificQuestion && userSpecificQuestion.trim() !== "") {
        specificRequest = `The user has a specific question about this idea: "${userSpecificQuestion}". Please provide a detailed and actionable answer to this specific question in KOREAN. Focus your response on directly addressing the user's query in the context of the idea. Consider all previous conversation history provided.`;
      } else {
        specificRequest = "Provide general advice on this idea in KOREAN (User question was not provided).";
      }
      break;
    case AICoachingPromptType.EXPLORE_RESOURCES:
      specificRequest = `Using Google Search, identify 3-5 highly relevant online resources (articles, tools, tutorials, case studies) that can help the user further develop or implement their idea.
For each resource, provide:
1. The name or title of the resource.
2. The direct URL.
3. A brief (1-2 sentence) KOREAN explanation of why this resource is relevant to the user's idea.
Present this as a numbered list. All your responses MUST BE IN KOREAN.
Example:
1. 자료명: 유용한 아티클 제목
   URL: https://example.com/article1
   설명: 이 아티클은 아이디어의 특정 측면에 대한 심층적인 정보를 제공합니다.
Ensure URLs are complete and correct. This information will help the user explore practical next steps.
`;
      break;
    case AICoachingPromptType.IDEA_ELABORATION:
      specificRequest = `Elaborate on the user's idea in KOREAN. Provide a more detailed breakdown of the concept. Suggest 2-3 related sub-ideas or potential expansions. Identify potential synergies with other common FIRE strategies. Discuss any less obvious pitfalls or opportunities for innovation related to this core idea. Be practical and inspiring.`;
      break;
    default:
      specificRequest = "Provide general guidance and encouragement for this idea in KOREAN.";
  }

  return `${promptHeader}\nYour task is to: ${specificRequest}\nKeep your response concise, actionable, and directly addressing the request. Avoid conversational fluff. Ensure your entire response is in KOREAN. Return only the core advice.`;
};

export const getAICoachingResponse = async (
  apiKey: string,
  prompt: string,
  coachingType: AICoachingPromptType
): Promise<{ textResponse: string; groundingMetadata?: GroundingChunk[] }> => {
  const ai = getAIInstance(apiKey);
  try {
    let config: any = {};
    if (coachingType === AICoachingPromptType.EXPLORE_RESOURCES) {
      config.tools = [{googleSearch: {}}];
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      ...(Object.keys(config).length > 0 && { config }),
    });

    const textResponse = response.text.trim();
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] | undefined;
    
    return { textResponse, groundingMetadata };

  } catch (error) {
    console.error("Error calling Gemini API for coaching:", error);
    let errorMessage = "AI 코칭 응답을 받는데 실패했습니다. ";
     if (error instanceof Error) {
        if (error.message.includes("API Key") || error.message.toLowerCase().includes("permission denied") || error.message.includes(GENERIC_API_KEY_ERROR_MESSAGE)) {
            errorMessage = GENERIC_API_KEY_ERROR_MESSAGE;
        } else {
            errorMessage += error.message;
        }
    }
    throw new Error(errorMessage);
  }
};

export const generateImageForIdea = async (apiKey: string, ideaTitle: string, ideaCategory: IdeaCategory): Promise<{ base64Image: string, Gprompt: string }> => {
  const ai = getAIInstance(apiKey);
  const Gprompt = `Concept art for a financial independence idea: "${ideaTitle}". Theme: ${ideaCategory}. Style: modern, minimalist, symbolic. Focus on clarity and positive financial growth.`;
  
  try {
    const response = await ai.models.generateImages({
        model: IMAGEN_MODEL_NAME, 
        prompt: Gprompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return { base64Image: `data:image/jpeg;base64,${base64ImageBytes}`, Gprompt };
    } else {
      console.error("Imagen API did not return valid image data:", response);
      throw new Error("AI 이미지 생성에 실패했습니다: 이미지 데이터를 받지 못했습니다.");
    }

  } catch (error) {
    console.error("Error calling Imagen API:", error);
    let errorMessage = "AI 이미지 생성에 실패했습니다. ";
    if (error instanceof Error) {
        if (error.message.includes("API Key") || error.message.toLowerCase().includes("permission denied") || error.message.includes(GENERIC_API_KEY_ERROR_MESSAGE)) {
            errorMessage = GENERIC_API_KEY_ERROR_MESSAGE;
        } else {
            errorMessage += error.message;
        }
    }
    throw new Error(errorMessage);
  }
};