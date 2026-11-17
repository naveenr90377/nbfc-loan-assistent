
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  Briefcase,
  Send,
  Bot,
  User,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

// Backend configuration
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Chat() {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I'm Asha, your loan assistant. I can help you check eligibility for personal, wedding, medical, or education loans. What is your full name?",
    },
  ]);

  const [input, setInput] = useState('');

  // Keep one session ID throughout this conversation
  const [sessionId] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedMessage, setFailedMessage] = useState('');

  const messagesEndRef = useRef(null);
  const requestLock = useRef(false);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isLoading]);

  // Send a message to the backend
  const sendMessage = async (message, addUserMessage = true) => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || requestLock.current) return;

    requestLock.current = true;
    setIsLoading(true);
    setError('');

    if (addUserMessage) {
      setMessages((prev) => [
        ...prev,
        { sender: 'user', text: trimmedMessage },
      ]);

      setInput('');
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/chat`,
        {
          message: trimmedMessage,
          sessionId,
        },
        {
          timeout: 30000,
        }
      );

      const aiReply = response.data?.reply;

      if (typeof aiReply !== 'string' || !aiReply.trim()) {
        throw new Error('The server returned an invalid response.');
      }

      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: aiReply },
      ]);

      setFailedMessage('');
    } catch (err) {
      console.error('Chat request failed:', err);

      setFailedMessage(trimmedMessage);

      setError(
        err.response?.data?.message ||
          err.message ||
          'Unable to connect to the server. Please try again.'
      );
    } finally {
      setIsLoading(false);
      requestLock.current = false;
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  // Retry the last failed request without adding another user message
  const handleRetry = () => {
    if (failedMessage) {
      sendMessage(failedMessage, false);
    }
  };

  // Check whether Asha is asking the user to confirm their details
  const lastAiMessage = [...messages]
    .reverse()
    .find((msg) => msg.sender === 'ai');

  const showConfirmationButtons =
    !isLoading &&
    !error &&
    lastAiMessage &&
    /is this correct|reply yes or no/i.test(lastAiMessage.text);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="bg-blue-900 p-2 rounded-lg">
            <Briefcase className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              FinEase Capital
            </h1>

            <p className="text-slate-500 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              AI-Assisted Loan Demo
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full space-y-5">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                msg.sender === 'user'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <Bot className="w-6 h-6 text-blue-600 mb-1 flex-shrink-0" />
              )}

              <div
                className={`max-w-[85%] sm:max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 rounded-bl-none text-slate-700 shadow-sm'
                }`}
              >
                {msg.text.split('\n').map((line, i) => (
                  <p
                    key={i}
                    className={`mb-1 ${
                      msg.sender === 'ai' &&
                      /\bAPPROVED\b/i.test(line)
                        ? 'text-green-600 font-bold'
                       : msg.sender === 'ai' &&
                          /\bREJECTED\b/i.test(line)
                        ? 'text-red-600 font-bold'
                        : ''
                    }`}
                  >
                    {line || '\u00A0'}
                  </p>
                ))}
              </div>

              {msg.sender === 'user' && (
                <User className="w-6 h-6 text-slate-400 mb-1 flex-shrink-0" />
              )}
            </div>
          ))}

          {/* Confirmation Actions */}
          {showConfirmationButtons && (
            <div className="ml-8 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => sendMessage('Yes')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Yes, that's right
              </button>

              <button
                type="button"
                onClick={() => sendMessage('No')}
                disabled={isLoading}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                Change
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 ml-8">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Asha is processing your request...
            </div>
          )}

          {/* Error and Retry */}
          {error && (
            <div className="ml-8 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>

              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading}
                className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-900 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Retry request
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-slate-200 bg-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
            />

            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          <p className="text-xs text-slate-400 mt-2 text-center">
            FinEase Capital is a demonstration project. Decisions are
            based on illustrative eligibility rules, not real lender
            approval.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Chat;
