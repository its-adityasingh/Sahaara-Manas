const PERPLEXITY_API_KEY = "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";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface PerplexityResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices: Array<{
    index?: number;
    finish_reason?: string;
    message: {
      role: string;
      content: string;
    };
    delta?: {
      role?: string;
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callPerplexityAPI(
  messages: PerplexityMessage[],
  model: string = "sonar-reasoning-pro"
): Promise<string> {
  const requestBody = {
    model,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })),
    temperature: 0.7,
    max_tokens: 2000,
  };

  console.log("Calling Perplexity API with model:", model);
  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      mode: "cors",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("API Response status:", response.status);

    if (!response.ok) {
      let errorText = "";
      let errorJson: any = null;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorJson = await response.json();
          errorText = JSON.stringify(errorJson, null, 2);
        } else {
          errorText = await response.text();
        }
        console.error("Perplexity API error:", response.status, errorText);
      } catch (e) {
        errorText = `HTTP ${response.status} - Could not parse error response`;
        console.error("Error parsing error response:", e);
      }
      
      // Return user-friendly error message
      if (response.status === 401) {
        return "Chinku's access key seems invalid. Please contact support.";
      } else if (response.status === 429) {
        return "Chinku is too busy right now! Please wait a moment and try again.";
      } else if (response.status === 400) {
        return `Chinku received a bad request. ${errorJson?.error?.message || "Please check your inputs and try again."}`;
      } else if (response.status >= 500) {
        return "Chinku's servers are having issues. Please try again in a few minutes.";
      }
      return `Chinku encountered an issue (Error ${response.status}). ${errorJson?.error?.message || "Please try again."}`;
    }

    const data: PerplexityResponse = await response.json();
    console.log("API Response data:", JSON.stringify(data, null, 2));
    
    if (!data) {
      console.error("No data in response");
      return "Chinku couldn't generate a response. No data received from API. Please try again.";
    }
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Invalid API response structure - no choices:", data);
      return "Chinku couldn't generate a response. The API returned an unexpected format. Please try again.";
    }
    
    const firstChoice = data.choices[0];
    if (!firstChoice || !firstChoice.message) {
      console.error("Invalid API response structure - no message:", firstChoice);
      return "Chinku couldn't generate a response. Invalid response structure. Please try again.";
    }
    
    let content = firstChoice.message.content;
    if (!content || typeof content !== "string" || content.trim() === "") {
      console.error("Empty or invalid content in API response:", content);
      return "Chinku generated an empty response. Please try again with different inputs.";
    }
    
    // Remove all markdown and thinking text
    content = content
      // Remove thinking/reasoning tags
      .replace(/<think>[\s\S]*?<\/think>/gi, "")
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
      .replace(/<think>[\s\S]*?<\/redacted_reasoning>/gi, "")
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, "")
      // Remove markdown bold/italic
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/__([^_]+)__/g, "<b>$1</b>")
      .replace(/_([^_]+)_/g, "$1")
      // Remove markdown lists
      .replace(/^[\s]*[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      // Remove formatting rules mentions
      .replace(/IMPORTANT FORMATTING RULES:[\s\S]*?Keep response/gmi, "")
      .replace(/CRITICAL FORMATTING RULES:[\s\S]*?Keep response/gmi, "")
      .replace(/STRICT RULES[\s\S]*?Keep response/gmi, "")
      .replace(/Format as:[\s\S]*?Keep response/gmi, "")
      .replace(/Structure:[\s\S]*?Keep response/gmi, "")
      // Remove any preamble about instructions
      .replace(/Looking at[\s\S]*?Output only/gmi, "")
      .replace(/Following[\s\S]*?Output only/gmi, "")
      .replace(/I need to[\s\S]*?Output only/gmi, "")
      .trim();
    
    // Find where actual content starts (after any remaining preamble)
    const contentStarters = ["<table>", "Weekly Schedule", "Training Frequency", "Daily Meal Plan", "Train", "Practice", "Breakfast", "Monday", "Exercise"];
    for (const starter of contentStarters) {
      const index = content.toLowerCase().indexOf(starter.toLowerCase());
      if (index > 0 && index < 300) {
        content = content.substring(index);
        break;
      }
    }
    
    console.log("Successfully got response from Chinku, length:", content.length);
    return content;
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    
    // Return a helpful error message instead of throwing
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      if (errorMsg.includes("failed to fetch") || errorMsg.includes("networkerror") || errorMsg.includes("network")) {
        return "Chinku can't connect right now. This might be a CORS or network issue. Please check your internet connection and try again. If the problem persists, Chinku might be taking a break! 😊";
      }
      if (errorMsg.includes("cors")) {
        return "Chinku is blocked by browser security (CORS). This might require a backend proxy. Please contact support.";
      }
      if (errorMsg.includes("timeout") || errorMsg.includes("aborted")) {
        return "Chinku is taking too long to respond. Please try again.";
      }
      if (errorMsg.includes("syntaxerror") || errorMsg.includes("json")) {
        return "Chinku received an invalid response format. Please try again.";
      }
      return `Chinku encountered an issue: ${error.message}. Please try again in a moment.`;
    }
    return "Chinku is having trouble right now. Please try again later!";
  }
}

// Helper function for Manas (Yoga/Meditation)
export async function getYogaRecommendation(
  userInput: string,
  userFeelings: string,
  userGoals: string
): Promise<string> {
  const systemPrompt = `You are an expert yoga instructor. Output ONLY the yoga plan content. NO markdown symbols (#, *, **, -, numbers). NO formatting rules. NO explanations. Start immediately with the plan.

Use HTML tables for schedules. Use <b>bold</b> for emphasis. Keep under 400 words. Output format: Weekly Schedule HTML table, then Recommended Asanas, then Breathing Techniques, then Precautions.`;

  const userPrompt = `Feelings: ${userFeelings}
Goals: ${userGoals}
${userInput ? `Additional Info: ${userInput}` : ""}

Generate a personalized yoga plan with weekly schedule table and specific recommendations.`;

  const messages: PerplexityMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return await callPerplexityAPI(messages);
}

// Helper function for Fit (Fitness)
export async function getFitnessRecommendation(
  fitnessGoal: string,
  userInput?: string
): Promise<string> {
  const systemPrompt = `You are an expert fitness trainer. Output ONLY the workout plan content. NO markdown symbols (#, *, **, -, numbers). NO formatting rules. NO explanations. Start immediately with the plan.

Use HTML tables for exercises and schedule. Use <b>bold</b> for emphasis. Keep under 400 words. Prefer bodyweight exercises. Output format: Training frequency, then Exercise HTML table, then Weekly Schedule HTML table, then Progression tips, then Safety tips.`;

  const userPrompt = `Goal: ${fitnessGoal}
${userInput ? `Additional Info: ${userInput}` : ""}

Generate a personalized workout plan with tables for schedule and exercises.`;

  const messages: PerplexityMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return await callPerplexityAPI(messages);
}

// Helper function for Nutrition
export async function getNutritionPlan(
  fitnessGoal: string,
  userInput?: string
): Promise<string> {
  const systemPrompt = `You are an expert nutritionist. Output ONLY the diet plan content. NO markdown symbols (#, *, **, -, numbers). NO formatting rules. NO explanations. Start immediately with the plan.

Use HTML tables for meal plans. Use <b>bold</b> for emphasis. Keep under 400 words. Indian context, budget-friendly. Output format: Daily Meal Plan HTML table, then Weekly Variations, then Budget Tips, then Quick Recipes.`;

  const userPrompt = `Goal: ${fitnessGoal}
${userInput ? `Additional Info: ${userInput}` : ""}

Generate a personalized diet plan with meal tables and practical tips.`;

  const messages: PerplexityMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  return await callPerplexityAPI(messages);
}
