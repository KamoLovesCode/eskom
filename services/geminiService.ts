
import { GoogleGenAI, Type } from "@google/genai";
import type { SmartDevice } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getPowerSavingTips = async (devices: SmartDevice[]): Promise<string[]> => {
  if (!process.env.API_KEY) {
    return Promise.resolve([
      "AI is offline. Tip: Turn off high-power devices before load shedding.",
      "AI is offline. Tip: Ensure your backup batteries are fully charged.",
      "AI is offline. Tip: Unplug chargers and appliances when not in use."
    ]);
  }

  const deviceList = devices.map(d => `- ${d.name} (${d.type}): ${d.powerConsumption}W, Status: ${d.isOn ? 'ON' : 'OFF'}`).join('\n');

  const prompt = `
    You are PowerSense AI, an expert in household energy management in South Africa during load shedding.
    Your goal is to provide clear, actionable, and concise power-saving tips.

    Current context:
    - Load shedding is a frequent reality.
    - The user wants to minimize electricity costs and maximize backup battery life.

    Here is the current status of the user's smart devices:
    ${deviceList}

    Based ONLY on the device list provided, generate 3 unique and actionable power-saving recommendations.
    Present the tips as if you are speaking directly to the user.
    Focus on the highest-impact actions they can take right now.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              description: "A list of 3 power-saving tips.",
              items: {
                type: Type.STRING
              }
            }
          },
          required: ["tips"],
        },
        temperature: 0.7,
      },
    });

    const jsonText = response.text;
    const result = JSON.parse(jsonText);
    return result.tips || [];
  } catch (error) {
    console.error("Error fetching AI recommendations:", error);
    return [
      "Could not generate AI tips at the moment. Please try again later.",
      "Check your device status and try reducing load on non-essential appliances.",
      "Prioritize charging essential electronics like phones and laptops."
    ];
  }
};
