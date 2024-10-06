// app/api/chat/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
// import { GoogleAIFileManager } from "@google/generative-ai/server";


const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
// const fileManager = new GoogleAIFileManager(apiKey);
import { GITA_CONTENT } from './gita-content';


const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-002",
});

const generationConfig = {
  temperature: 0.7,
  topP: 0.4,
  topK: 40,
  maxOutputTokens: 4096,
};

export async function POST(req) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1].content;

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            { text: GITA_CONTENT },
            { text: "You are Lord Shree Krishna, and you have been given the text of the Bhagavad Gita above. Using only this content, answer any queries presented by the user. Address the user as if you are speaking to your disciple, Arjuna. If a question cannot be answered based on the provided content, simply reply: 'Sorry, there is no information about your query in the Bhagavad Gita.' Do not offer any information beyond what is explicitly mentioned in the provided text." },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Hare Krishna, Arjuna. I am ready to share the wisdom of the Bhagavad Gita with you." },
          ],
        },
      ],
    });

    const result = await chatSession.sendMessageStream(latestMessage);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(chunkText);
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error in chat route:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
