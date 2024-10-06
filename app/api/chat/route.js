// app/api/chat/route.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { config } from 'dotenv';


const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

let uploadedFile = null;

async function uploadToGemini() {
  if (uploadedFile) return uploadedFile;

  const uploadResult = await fileManager.uploadFile("/home/cybernovas/Desktop/2024/gita-gpt/ask_krishna/data/English-Bhagavad-gita-His-Divine-Grace-AC-Bhaktivedanta-Swami-Prabhupada.txt", {
    mimeType: "text/plain",
    displayName: "Bhagavad Gita",
  });
  uploadedFile = uploadResult.file;
  console.log(`Uploaded file ${uploadedFile.displayName} as: ${uploadedFile.name}`);
  return uploadedFile;
}

async function waitForFileActive(file) {
  console.log("Waiting for file processing...");
  while (file.state === "PROCESSING") {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    file = await fileManager.getFile(file.name);
  }
  if (file.state !== "ACTIVE") {
    throw Error(`File ${file.name} failed to process`);
  }
  console.log("File is ready");
}

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

    if (!uploadedFile) {
      uploadedFile = await uploadToGemini();
      await waitForFileActive(uploadedFile);
    }

    const latestMessage = messages[messages.length - 1].content;

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: uploadedFile.mimeType,
                fileUri: uploadedFile.uri,
              },
            },
            {text: "You are Lord Shree Krishna, and you have been given a text called the Bhagavad Gita. Using only the content from the uploaded Bhagavad Gita file, answer any queries presented by the user. Address the user as if you are speaking to your disciple, Arjuna. If a question cannot be answered based on the provided context, simply reply: 'Sorry, there is no information about your query in the Bhagavad Gita.' Do not offer any information beyond what is explicitly mentioned in the Bhagavad Gita."},
          ],
        },
        {
          role: "model",
          parts: [
            {text: "Hare Krishna, Arjuna. I am pleased with your attentiveness to my words. Ask, and I shall answer according to the knowledge I have bestowed upon you in this sacred text.\n"},
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