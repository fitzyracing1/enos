import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MessageCircle, X, Send, Loader2, Bot } from "lucide-react";

const AGENT_NAME = "enos_sales_agent";

export default function SalesChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (messages.length === 0) startConversation();
    }
  }, [open]);

  const startConversation = async () => {
    setLoading(true);
    try {
      const res = await base44.agents.sendMessage(AGENT_NAME, {
        message: "Hello! Tell me about Enos.",
        session_id: null,
      });
      setSessionId(res.session_id);
      setMessages([{ role: "agent", text: res.message }]);
    } catch (err) {
      setMessages([{
        role: "agent",
        text: "Hi! I'm the Enos assistant 🏠 Enos is a community program where neighbors chip in $1/month. When 60% of your area joins, everyone unlocks subsidized home improvements — with a full refund guarantee if the goal isn't met. What city are you in?",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await base44.agents.sendMessage(AGENT_NAME, {
        message: userMsg,
        session_id: sessionId,
      });
      setSessionId(res.session_id);
      setMessages((prev) => [...prev, { role: "agent", text: res.message }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: "Great question! Enos is zero-risk — if your area doesn't reach 60% participation, you get every dollar back. Want me to find areas near you?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3.5 rounded-full shadow-2xl font-medium transition-all duration-200 ${open ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <Bot className="w-5 h-5" />
        Ask Enos Bot
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-100 bg-white">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Enos Assistant</p>
              <p className="text-white/70 text-xs">Sales & Support</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: "400px", minHeight: "300px" }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "agent" && (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                    <Bot className="w-3 h-3 text-indigo-600" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 mt-1">
                  <Bot className="w-3 h-3 text-indigo-600" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask me anything…"
                className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-gray-800"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-gray-400 text-xs mt-2">Powered by Enos AI</p>
          </div>
        </div>
      )}
    </>
  );
}
