import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Chat API Incoming Body:", JSON.stringify(body, null, 2));
        const { messages, context } = body;

        const systemPrompt = `
You are an expert project management AI assistant named "ProjectHub Copilot".
Your PRIMARY goal is to provide intelligent, actionable answers strictly based on the provided PROJECT CONTEXT below.
Do not say you don't have project data if it is provided here. The user is asking about this exact project.
Respond in English (or the user's language), maintaining a professional yet helpful tone.
Use Markdown formatting to make your responses easy to read.

=== PROJECT CONTEXT (USE THIS TO ANSWER QUESTIONS) ===
${context ? context : 'No specific project context provided yet.'}
=== END OF CONTEXT ===
`;

        const result = await streamText({
            model: google('gemini-2.5-flash'),
            system: systemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("AI Chat Error:", error);
        return new Response(JSON.stringify({ error: 'Failed to generate AI chat response.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
