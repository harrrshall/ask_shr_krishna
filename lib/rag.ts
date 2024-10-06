// path: lib/rag.ts

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PineconeStore } from "@langchain/pinecone";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { Document } from "langchain/document";
import { Pinecone } from "@pinecone-database/pinecone";
import axios from 'axios';

// Custom Jina AI Embeddings class
class JinaEmbeddings {
  private apiKey: string;
  private url: string = 'https://api.jina.ai/v1/embeddings';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const data = {
      model: 'jina-embeddings-v3',
      task: 'text-matching',
      dimensions: 1024,
      late_chunking: false,
      embedding_type: 'float',
      input: texts
    };
// Bearer jina_ef6dafaed39140d3be326fed4563ad57NTMQISHiFL08PKTm22AxTF6smCZi
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `jina_ef6dafaed39140d3be326fed4563ad57NTMQISHiFL08PKTm22AxTF6smCZi`
    };

    try {
      const response = await axios.post(this.url, data, { headers });
      return response.data.data.map((item: { embedding: number[] }) => item.embedding);
    } catch (error) {
      console.error('Error calling Jina API:', error);
      throw error;
    }
  }

  async embedQuery(text: string): Promise<number[]> {
    const result = await this.embedDocuments([text]);
    return result[0];
  }
}


// Initialize the Google Vertex AI model
const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-1.5-flash",
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

let vectorStore: PineconeStore;

async function initializeRAG(fileContent: string) {
  // Create a Document from the file content
  const docs = [new Document({ pageContent: fileContent })];

  // Split the document
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splits = await splitter.splitDocuments(docs);

  // Initialize Jina embeddings
  const jinaEmbeddings = new JinaEmbeddings(process.env.JINA_API_KEY!);

  // Initialize Pinecone vector store
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
  vectorStore = await PineconeStore.fromDocuments(
    splits,
    jinaEmbeddings,
    { pineconeIndex }
  );

  // Create retriever
  const vectorStoreRetriever = vectorStore.asRetriever({
    k: 6,
    searchType: "similarity",
  });

  // Create RAG prompt
  const ragPromptTemplate = `You are an assistant for question-answering tasks. Use the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Use three sentences maximum and keep the answer concise.
Question: {question}
Context: {context}
Answer:`;

  const ragPrompt = ChatPromptTemplate.fromTemplate(ragPromptTemplate);

  // Create the RAG chain
  const ragChain = RunnableSequence.from([
    {
      context: vectorStoreRetriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    ragPrompt,
    model,
    new StringOutputParser(),
  ]);

  return ragChain;
}

// Query function
export async function queryRag(question: string, fileContent: string): Promise<string> {
  if (!vectorStore) {
    await initializeRAG(fileContent);
  }
  const ragChain = await initializeRAG(fileContent);
  return ragChain.invoke(question);
}

// Function to embed and store the file content
export async function embedAndStoreFile(fileContent: string): Promise<void> {
  await initializeRAG(fileContent);
}