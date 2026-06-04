'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

export default function Home() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.lang = 'bn-BD'; // Support Bengali natively. English also works.
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onresult = async (event: any) => {
          const text = event.results[0][0].transcript;
          setTranscript(text);
          await handleSendMessage(text);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        alert("আপনার ব্রাউজার ভয়েস রেকগনিশন সাপোর্ট করে না। দয়া করে Google Chrome ব্যবহার করুন।");
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      if (data.response) {
        setMessages(prev => [...prev, { role: 'ai', text: data.response }]);
        speak(data.response);
      }
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a Bengali voice specifically
      const voices = window.speechSynthesis.getVoices();
      const bengaliVoice = voices.find(v => v.lang.includes('bn') || v.lang.includes('BN'));
      
      if (bengaliVoice) {
        utterance.voice = bengaliVoice;
      } 
      // If we force utterance.lang = 'bn-BD' and Windows doesn't have a Bengali voice installed, it goes completely silent. 
      // So we don't set any fallback lang, letting it use the default system voice (at least it will make a sound).
      
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="max-w-2xl w-full flex flex-col items-center space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-pulse">
            Sehrish AI
          </h1>
          <p className="text-neutral-400 text-lg">আপনার এআই সহকারী সেহরিশ-এর সাথে কথা বলুন</p>
        </div>

        {/* Visualizer / Mic Button */}
        <div className="relative flex items-center justify-center h-48 w-48">
          {isListening && (
            <>
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-40 animate-ping"></div>
              <div className="absolute inset-4 bg-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
            </>
          )}
          
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`relative z-10 p-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isProcessing ? (
              <Loader2 className="w-12 h-12 text-white animate-spin" />
            ) : isListening ? (
              <MicOff className="w-12 h-12 text-white" />
            ) : (
              <Mic className="w-12 h-12 text-white" />
            )}
          </button>
        </div>

        {/* Status Text */}
        <div className="h-8 flex items-center justify-center">
          {isListening && <p className="text-blue-400 font-medium tracking-widest animate-pulse">শুনছি...</p>}
          {isProcessing && <p className="text-purple-400 font-medium tracking-widest animate-pulse">ভাবছি...</p>}
          {!isListening && !isProcessing && <p className="text-neutral-500">কথা বলতে মাইক্রোফোনে চাপুন</p>}
        </div>

        {/* Chat History */}
        <div className="w-full max-w-lg mt-8 space-y-4 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-br-none' 
                    : 'bg-purple-600/20 text-purple-100 border border-purple-500/30 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {transcript && isListening && (
            <div className="flex w-full justify-end">
              <div className="max-w-[80%] p-4 rounded-2xl bg-blue-600/10 text-blue-200/50 border border-blue-500/10 rounded-br-none italic">
                {transcript}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-neutral-500 text-sm pb-8">
          <p>Developed by <span className="text-purple-400 font-medium">Farhan Sadik Turjo</span></p>
          <div className="flex items-center justify-center space-x-4 mt-3">
            <a href="https://github.com/farhan5178" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <span>•</span>
            <a href="https://www.linkedin.com/in/farhan-sadik-turjo/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
              LinkedIn
            </a>
            <span>•</span>
            <a href="https://www.instagram.com/farhansadik_turjo/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
              Instagram
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
