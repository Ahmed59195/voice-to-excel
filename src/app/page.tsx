'use client';
import { useRef, useState } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
  }
}


export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const [downloading, setDownloading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const speak = (text: string, langCode: string) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();

    let voice: SpeechSynthesisVoice | null = null;

    if (langCode === 'ur-PK') {
      voice = voices.find(v =>
        v.lang.toLowerCase().includes('ur') || v.name.toLowerCase().includes('urdu')
      ) || null;
    }

    if (!voice && langCode === 'en-US') {
      voice = voices.find(v => v.lang === 'en-US') || null;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    if (voice) {
      utterance.voice = voice;
    }

    synth.speak(utterance);
  };

  const generateExcel = async () => {
    setDownloading(true);
    const res = await fetch('/api/excel', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      alert('❌ Failed to generate Excel file');
      setDownloading(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sheet.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    setDownloading(false);

    if (language === 'en') {
      speak('Your Excel sheet is ready for download.', 'en-US');
    } else {
      speak('آپ کی شیٹ تیار ہے', 'ur-PK');
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'ur-PK';
    recognition.interimResults = true;
    recognition.continuous = true;

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      setPrompt(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🎙️ Speech error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        alert('❌ No speech detected. Please try again.');
      } else if (event.error === 'not-allowed') {
        alert('❌ Microphone access denied.');
      } else {
        alert(`❌ Speech error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('🛑 Stopped listening');
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-md flex flex-col gap-y-4">
        <h1 className="text-2xl font-bold text-center">📱 Voice to Excel Sheet Agent</h1>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <label htmlFor="language" className="text-sm">🌐 Language:</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'ur')}
            className="flex-1 border px-2 py-2 rounded-md text-base"
          >
            <option value="en">🇬🇧 English</option>
            <option value="ur">🇵🇰 Urdu</option>
          </select>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          className="w-full border rounded-md p-3 text-base"
          placeholder="Speak or type your Excel instructions..."
        />

        <div className="flex flex-col sm:flex-row gap-3">
          {!isListening ? (
            <button
              onClick={startListening}
              className="flex-1 py-3 text-lg bg-green-600 text-white rounded-xl"
            >
              🎙️ Speak
            </button>
          ) : (
            <button
              onClick={stopListening}
              className="flex-1 py-3 text-lg bg-red-600 text-white rounded-xl"
            >
              🛑 Stop Listening
            </button>
          )}

          <button
            onClick={generateExcel}
            className="flex-1 py-3 text-lg bg-blue-600 text-white rounded-xl disabled:opacity-50"
            disabled={downloading}
          >
            {downloading ? '⏳ Generating...' : '⬇️ Download Excel'}
          </button>
        </div>
      </div>
    </main>
  );
}
