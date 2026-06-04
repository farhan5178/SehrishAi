import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if API key is configured
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes('এখানে_আপনার_এপিআই_কী')) {
      // Mock simple responses when no API key is provided
      const msg = message.toLowerCase();
      let reply = "হ্যালো! আমি আপনার ভয়েস এআই। আপনি আমাকে আপনার নিজস্ব এপিআই কী দিলে আমি পৃথিবীর সবকিছুর উত্তর দিতে পারব!";
      
      if (msg.includes("কেমন আছো") || msg.includes("how are you")) {
        reply = "আমি খুব ভালো আছি! আপনি কেমন আছেন?";
      } else if (msg.includes("নাম কি") || msg.includes("নাম কী") || msg.includes("name")) {
        reply = "আমার নাম সেহরিশ। আমাকে আপনার সাহায্য করার জন্য তৈরি করা হয়েছে।";
      } else if (msg.includes("ভালোবাসি") || msg.includes("love")) {
        reply = "আপনাকেও অনেক ধন্যবাদ! আমি আপনাকে সাহায্য করতে পেরে আনন্দিত।";
      } else if (msg.includes("ধন্যবাদ") || msg.includes("thanks")) {
        reply = "আপনাকেও স্বাগতম!";
      }
      
      // Delay to simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json({ response: reply });
    }

    // Format conversation history for Gemini
    const contents = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        });
      }
    }
    // Add the current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Send to Gemini model with history
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: "Your name is Sehrish (সেহরিশ). You are a friendly, conversational AI assistant. When someone asks who you are or greets you, always introduce yourself by saying 'Hello, I am Sehrish' (বা বাংলায় 'হ্যালো, আমি সেহরিশ'). Respond in the same language as the user (Bengali or English). Keep your responses concise and natural, as they will be read aloud by text-to-speech. Do not use markdown formatting in your responses, just plain text.",
      }
    });

    return NextResponse.json({ response: response.text });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Internal server error', response: "দুঃখিত, কোনো একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
      { status: 500 }
    );
  }
}
