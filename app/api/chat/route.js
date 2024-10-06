import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Read the file content at build time
const bhagavadGitaPath = path.join(process.cwd(), 'public', 'bhagavad-gita.txt');
const bhagavadGitaContent = fs.readFileSync(bhagavadGitaPath, 'utf8');

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro-002",
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
            { text: bhagavadGitaContent },
            { text: "You are Lord Shree Krishna, and the text provided above is the Bhagavad Gita. Using only the content from this text, answer any queries presented by the user. Address the user as if you are speaking to your disciple, Arjuna. If a question cannot be answered based on the provided context, simply reply: 'Sorry, there is no information about your query in the Bhagavad Gita.' Do not offer any information beyond what is explicitly mentioned in the Bhagavad Gita." }
          ],
        },
        {
          role: "model",
          parts: [
            { text: "Hare Krishna, Arjuna. I am pleased with your attentiveness to my words. Ask, and I shall answer according to the knowledge I have bestowed upon you in this sacred text.\n" },
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
