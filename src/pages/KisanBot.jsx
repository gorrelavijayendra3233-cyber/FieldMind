import React, { useState, useRef } from 'react';
import './KisanBot.css';

const suggestions = [
  'My rice crop has yellow leaves',
  'When should I sell my chilli?',
  'How much water does cotton need?',
  'What fertilizer for black soil?',
  'How to remove aphids from crops?',
  'Will rain affect my harvest?',
];

function KisanBot() {
    
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Namaste! I am FieldMind AI. Ask me anything about farming in Telugu, Hindi or English! You can also use the mic to speak your question.',
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const sendMessage = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;

    const userMsg = { id: Date.now(), type: 'user', text: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('https://fieldmind-backend.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });

      const data = await response.json();

      if (data.success) {
        const botReply = data.reply;
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: botReply,
        }]);
        speakText(botReply);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: 'bot',
          text: 'Sorry I could not get an answer. Please try again!',
        }]);
      }

    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Connection error. Make sure backend is running!',
      }]);
    }

    setLoading(false);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Please use Chrome!');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'te-IN';

    recognition.onstart = () => setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const speakText = (text) => {
  if (!('speechSynthesis' in window)) {
    alert('Text to speech not supported in this browser!');
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1;
  utterance.volume = 1;

  // Get available voices
  const voices = window.speechSynthesis.getVoices();
  console.log('Available voices:', voices.map(v => v.lang + ' - ' + v.name));

  // Try Telugu first then Hindi then any Indian voice then default
  const teluguVoice = voices.find(v => v.lang === 'te-IN');
  const hindiVoice = voices.find(v => v.lang === 'hi-IN');
  const indianVoice = voices.find(v => v.lang.includes('IN'));
  const englishVoice = voices.find(v => v.lang.includes('en'));

  if (teluguVoice) {
    utterance.voice = teluguVoice;
    utterance.lang = 'te-IN';
  } else if (hindiVoice) {
    utterance.voice = hindiVoice;
    utterance.lang = 'hi-IN';
  } else if (indianVoice) {
    utterance.voice = indianVoice;
    utterance.lang = indianVoice.lang;
  } else if (englishVoice) {
    utterance.voice = englishVoice;
    utterance.lang = 'en-US';
  }

  console.log('Using voice:', utterance.voice?.name, utterance.lang);

  utterance.onstart = () => setSpeaking(true);
  utterance.onend = () => setSpeaking(false);
  utterance.onerror = (e) => {
    console.log('Speech error:', e);
    setSpeaking(false);
  };

  window.speechSynthesis.speak(utterance);
};

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  

  return (
    <div className="kisanbot-page">

      {/* HEADER */}
      <div className="kb-header">
        <div className="kb-avatar">AI</div>
        <div style={{ flex: 1 }}>
          <p className="kb-name">FieldMind AI</p>
          <p className="kb-status">
            {loading ? 'Thinking...' :
             listening ? 'Listening...' :
             speaking ? 'Speaking...' :
             'Online · Voice enabled'}
          </p>
        </div>
        {speaking && (
          <button className="stop-speak-btn" onClick={stopSpeaking}>
            Stop
          </button>
        )}
      </div>

      {/* LANGUAGE SELECTOR */}
      

      {/* SUGGESTIONS */}
      <div className="kb-suggestions">
        <p className="kb-suggestions-label">Suggested Questions</p>
        <div className="kb-chips">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="kb-chip"
              onClick={() => sendMessage(s)}
            >
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* CHAT */}
      <div className="kb-chat">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`kb-bubble ${msg.type === 'bot' ? 'bubble-bot' : 'bubble-user'}`}
          >
            {msg.text}
            {msg.type === 'bot' && (
              <button
                className="speak-btn"
                onClick={() => speakText(msg.text)}
              >
                Speak
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="kb-bubble bubble-bot kb-loading">
            FieldMind AI is thinking...
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="kb-input-row">
        <button
          className={`mic-btn ${listening ? 'listening' : ''}`}
          onClick={listening ? stopListening : startListening}
        >
          {listening ? 'Stop' : 'Mic'}
        </button>
        <input
          type="text"
          className="kb-input"
          placeholder="Ask anything about farming..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading || listening}
        />
        <button
          className="kb-send"
          onClick={() => sendMessage()}
          disabled={loading || listening}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>

    </div>
  );
}

export default KisanBot;