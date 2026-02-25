import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const { prompt, context } = await req.json();

        const systemPrompt = `
      You are an expert project management AI assistant named "ProjectHub Copilot". 
      Your goal is to provide intelligent, actionable recommendations based on the project data provided.
      Respond in English, maintaining a professional yet helpful tone.
      
      CONTEXT:
      ${context}
    `;

        const result = await generateText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            prompt: prompt,
        });

        return new Response(JSON.stringify({ text: result.text }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error("AI Generation Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to generate AI response.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
