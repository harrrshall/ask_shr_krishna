// components/fullscreen-functional-chatbot-with-krishna-logo.tsx
'use client';
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plane, Send } from "lucide-react";
import Image from "next/image";
import ReactMarkdown from 'react-markdown';
import { Analytics } from "@vercel/analytics/react";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  timeTaken?: number;
};

export default function KrishnaChatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: "user",
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInputValue("");
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: inputValue }],
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botResponseText = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        botResponseText += decoder.decode(value);
        
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000; // Convert to seconds

        const botResponse: Message = {
          id: Date.now(),
          text: botResponseText,
          sender: "bot",
          timeTaken: timeTaken,
        };
        setMessages((prevMessages) => [
          ...prevMessages.filter(m => m.sender !== "bot"),
          botResponse
        ]);
      }
    } catch (error) {
      console.error("Error querying chatbot:", error);
      const errorMessage: Message = {
        id: Date.now(),
        text: "Sorry, I encountered an error while processing your request.",
        sender: "bot",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInputValue("");
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 flex flex-col">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" className="rounded-full p-0" onClick={handleReset}>
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/my_anime_style_krishna_portrait_by_jazylh_d8k4ts5-414w-2x-XMAHIbUQcRZXL0U7eHX9S5ayIOCswG.jpg"
            alt="Krishna Logo"
            width={50}
            height={50}
            className="rounded-full"
          />
          <span className="sr-only">Home</span>
        </Button>
      </div>
      <div className="flex-grow overflow-auto px-4 py-8 mt-16">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-full">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/my_anime_style_krishna_portrait_by_jazylh_d8k4ts5-414w-2x-XMAHIbUQcRZXL0U7eHX9S5ayIOCswG.jpg"
              alt="Krishna Logo"
              width={100}
              height={100}
              className="rounded-full mb-6"
            />
            <h1 className="text-2xl font-semibold text-center mb-2">Jai Shree Krishna</h1>
            <p className="text-center text-gray-600 mb-8">How may I assist you today?</p>
            <p className="text-center text-sm text-gray-500 mb-8 max-w-md">
              I am here to help with any questions or guidance you seek. Let&rsquo;s begin our conversation!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mb-8">
              <Button variant="outline" className="h-auto py-4 px-6" onClick={() => setInputValue("Tell me about the teachings of Krishna")}>
                <Plane className="w-5 h-5 mr-2" />
                Krishna s Teachings
              </Button>
              <Button variant="outline" className="h-auto py-4 px-6" onClick={() => setInputValue("What is the significance of the Bhagavad Gita?")}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                </svg>
                Bhagavad Gita Significance
              </Button>
              <Button variant="outline" className="h-auto py-4 px-6" onClick={() => setInputValue("How can I apply Krishna's wisdom in modern life?")}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  height="24"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Krishna&rsquo;s Wisdom Today
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-md p-4 rounded-lg ${
                    message.sender === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {message.sender === "bot" ? (
                    <>
                      <ReactMarkdown>{message.text}</ReactMarkdown>
                      {message.timeTaken && (
                        <div className="text-xs text-gray-500 mt-2">
                          Time taken: {message.timeTaken.toFixed(2)} seconds
                        </div>
                      )}
                    </>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-md p-4 rounded-lg bg-gray-200 text-gray-800">
                  Contemplating...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t">
        <div className="relative max-w-4xl mx-auto">
          <Input
            className="pr-20 rounded-full"
            placeholder="Ask Krishna for guidance..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            className="absolute right-1 top-1 rounded-full px-4"
            size="sm"
            onClick={handleSend}
            disabled={isLoading}
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
      <Analytics />
    </div>
  );
}