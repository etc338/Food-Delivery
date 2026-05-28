// ─────────────────────────────────────────────────────────────────
//  AiChatbot.jsx — Vingo AI Chatbot  (Full Multi-Turn + Formatted)
// ─────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { FaRobot, FaTimes, FaPaperPlane, FaRedo, FaPlus, FaShoppingCart } from "react-icons/fa";
import { MdAutoAwesome } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, removeCartItem, clearCart, updateQuantity } from "../redux/userSlice";

// ─────────────────────────────────────────────────────────────────
//  COMPONENT: FormattedMessage
//  Why: Gemini returns text with markdown-style formatting like **bold**
//       and - bullet points. Without this component, the raw asterisks
//       and dashes would show up as plain text. This component parses
//       them into real styled JSX elements.
// ─────────────────────────────────────────────────────────────────
function FormattedMessage({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // Convert **word** → <strong>word</strong>
        const withBold = line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="font-black">{part}</strong> : part
        );

        // Bullet point: line starts with "- "
        if (/^[-*]\s/.test(line)) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#ff4d2d] flex-shrink-0" />
              <span>{withBold}</span>
            </div>
          );
        }

        // Numbered list: line starts with "1. " or "2. " etc.
        const numberedMatch = line.match(/^(\d+)\.\s(.*)/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 text-[#ff4d2d] text-[10px] font-black flex items-center justify-center mt-0.5">
                {numberedMatch[1]}
              </span>
              <span>{numberedMatch[2]}</span>
            </div>
          );
        }

        // Heading: line starts with "## " or "# "
        if (/^#{1,2}\s/.test(line)) {
          return <p key={i} className="font-black text-gray-800">{line.replace(/^#{1,2}\s/, "")}</p>;
        }

        return <p key={i}>{withBold}</p>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  QUICK PROMPTS — shown before the user types anything
//  These chip buttons let users test common scenarios with one click.
//  Each maps to a pre-written question string that gets sent as a message.
// ─────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: "🌶️", label: "Spicy food",      text: "What spicy food do you have?" },
  { icon: "🥗", label: "Veg only",         text: "Show me all vegetarian options available" },
  { icon: "💰", label: "Under ₹200",       text: "What can I order for under ₹200?" },
  { icon: "🏆", label: "Recommend for me", text: "Based on my past orders, what should I order today?" },
  { icon: "🛵", label: "How to order",     text: "How do I place an order on Vingo?" },
  { icon: "❌", label: "Cancel order",     text: "How do I cancel my order?" },
];

// ─────────────────────────────────────────────────────────────────
//  MAIN COMPONENT: AiChatbot
// ─────────────────────────────────────────────────────────────────
export default function AiChatbot() {
  const dispatch = useDispatch();
  const { cartItems } = useSelector((state) => state.user);

  // ── UI States
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [lastFailedPrompt, setLastFailedPrompt] = useState(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // ── messages: the VISUAL chat log shown to the user
  // Each entry: { role: "user" | "ai", text: "...", items: [...], isError: bool }
  const [messages, setMessages] = useState([{
    role: "ai",
    text: "Hi! 👋 I'm **Vingo AI**, your smart food assistant!\n\nI can help you:\n- Find the perfect dish for your mood\n- Recommend food based on your past orders\n- Answer any questions about ordering\n\nWhat are you craving today? 🍽️",
  }]);

  // ── geminiHistory: the raw conversation history we send to the Gemini API
  // This is SEPARATE from the visual messages[] above because:
  //   • messages[] has UI metadata (isError, role: "ai")
  //   • geminiHistory[] uses Gemini's exact format (role: "model", parts: [{ text }])
  // We maintain both in sync so the AI has memory of the full conversation.
  const [geminiHistory, setGeminiHistory] = useState([]);

  // ── Refs for smooth UX
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom whenever messages update or chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [messages, isOpen]);

  // ── Dynamic Loading UX
  // Cycles through loading messages every 2 seconds to keep the user engaged
  const loadingMessages = [
    "Understanding your request...",
    "Scanning the Vingo menu...",
    "Finding the best matches...",
    "Writing a recommendation..."
  ];

  useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, loadingMessages.length - 1));
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Focus input field when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // ─────────────────────────────────────────────────────────────────
  //  FUNCTION: sendMessage
  //  This is the core function that handles sending a message to the AI.
  //  It is called both from the form submit AND from quick prompt clicks.
  // ─────────────────────────────────────────────────────────────────
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || isLoading) return;

    // ── Step A: Hide quick prompts after first message (they've started chatting)
    setShowQuickPrompts(false);

    // ── Step B: Add the user's message to the VISUAL chat log immediately
    // We do this before the API call so the UI feels instant and responsive.
    const userMsg = { role: "user", text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setLastFailedPrompt(null);

    // ── Step C: Build the Gemini history to send with this request
    // We take the existing geminiHistory (all previous turns) and we DO NOT
    // add the current message here — sendMessage() in the backend adds it.
    // So geminiHistory is always the conversation BEFORE the current message.
    const historyToSend = geminiHistory;

    try {
      // ── Step D: POST to /api/ai/ask with both the current prompt AND history
      // The backend uses history to give Gemini memory of the conversation.
      const response = await axios.post(
        `${serverUrl}/api/ai/ask`,
        {
          prompt: messageText,    // The new message the user just typed
          history: historyToSend, // All previous turns so Gemini remembers context
        },
        {
          withCredentials: true,
          timeout: 25000, // 25 second timeout — Gemini can be slow on complex queries
        }
      );

      const aiReply = response.data.reply;
      const aiItems = response.data.items || [];
      const aiActions = response.data.actions || [];

      // ── Step E.1: Execute AI Actions (Function Calling)
      if (aiActions.length > 0) {
        aiActions.forEach(action => {
          if (action.type === "CLEAR_CART") {
            dispatch(clearCart());
          } else if (action.type === "REMOVE_FROM_CART" && action.itemId) {
            if (action.quantity) {
              // The AI wants to remove a specific amount (e.g. "remove 5 samosas")
              const existingItem = cartItems.find((i) => i.id === action.itemId);
              if (existingItem) {
                const newQuantity = existingItem.quantity - action.quantity;
                if (newQuantity > 0) {
                  dispatch(updateQuantity({ id: action.itemId, quantity: newQuantity }));
                } else {
                  dispatch(removeCartItem(action.itemId));
                }
              }
            } else {
              // The AI wants to remove the item entirely
              dispatch(removeCartItem(action.itemId));
            }
          } else if (action.type === "ADD_TO_CART" && action.item) {
            dispatch(
              addToCart({
                id: action.item._id,
                name: action.item.name,
                price: action.item.price,
                image: action.item.image,
                shop: action.item.shop,
                quantity: action.quantity || 1,
                foodType: action.item.foodType,
              })
            );
          }
        });
      }

      // ── Step E.2: Add AI reply to the VISUAL messages log with Generative UI items
      setMessages(prev => [...prev, { role: "ai", text: aiReply, items: aiItems }]);

      // ── Step F: Update geminiHistory with BOTH the user turn AND AI reply
      // This is the critical step for Level 1 (Memory).
      // On the NEXT message, geminiHistory will contain this exchange,
      // so Gemini will remember what was said in this turn.
      //
      // Gemini's required format for history:
      //   role: "user" or "model"  (Gemini uses "model" not "ai")
      //   parts: [ { text: "..." } ]   (must be an array, not a plain string)
      setGeminiHistory(prev => [
        ...prev,
        { role: "user",  parts: [{ text: messageText }] },
        { role: "model", parts: [{ text: aiReply }] },
      ]);

    } catch (error) {
      const isTimeout   = error.code === "ECONNABORTED" || error.message?.includes("timeout");
      const isRateLimit = error.response?.status === 429;
      
      const errorText = isRateLimit
        ? (error.response?.data?.reply || "⏳ Vingo AI is busy right now due to high demand. Please wait a minute and try again!")
        : isTimeout
        ? "⏱️ Vingo AI is taking too long. **Tap retry** or try a simpler question!"
        : (error.response?.data?.reply || "❌ Something went wrong. Check your internet and try again.");

      setMessages(prev => [...prev, { role: "ai", text: errorText, isError: true }]);
      // Don't set lastFailedPrompt for rate limit errors — retrying immediately won't help
      if (!isRateLimit) setLastFailedPrompt(messageText);
      // Note: on error we do NOT update geminiHistory, so the failed turn
      // is not included in the memory. The user can retry cleanly.
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input.trim()); };
  const handleRetry  = () => { if (lastFailedPrompt) sendMessage(lastFailedPrompt); };

  return (
    <>
      {/* ── Floating Robot Button (hides when chat is open) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] rounded-full shadow-2xl flex items-center justify-center text-white text-2xl hover:scale-110 transition-all duration-300 z-50 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <FaRobot />
        {/* Green pulse dot to indicate the assistant is "online" */}
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
      </button>

      {/* ── Chat Window */}
      <div className={`fixed bottom-6 right-6 w-[calc(100vw-48px)] sm:w-[380px] h-[580px] max-h-[85vh] bg-white rounded-[24px] shadow-2xl border border-gray-100 flex flex-col z-50 transition-all duration-500 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white rounded-t-[24px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <MdAutoAwesome className="text-lg" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-wide">Vingo AI</h3>
              <p className="text-[10px] text-white/80 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                Smart Food Assistant · Memory Enabled
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center transition-colors">
            <FaTimes />
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-orange-50/30 to-gray-50/30 scrollbar-hide">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {/* AI avatar icon */}
              {msg.role === "ai" && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] flex items-center justify-center flex-shrink-0 mb-0.5">
                  <MdAutoAwesome className="text-white text-[10px]" />
                </div>
              )}
              {/* Message bubble */}
              <div className={`max-w-[85%] px-3.5 py-3 rounded-2xl shadow-sm ${
                msg.role === "user"
                  ? "bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] text-white rounded-br-sm text-sm font-medium"
                  : `bg-white border ${msg.isError ? "border-red-100" : "border-gray-100"} text-gray-700 rounded-bl-sm`
              }`}>
                {msg.role === "ai" ? <FormattedMessage text={msg.text} /> : msg.text}
                
                {/* ── GENERATIVE UI: Render Food Items if AI recommended any ── */}
                {msg.items && msg.items.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    {msg.items.map((item) => (
                      <div key={item._id} className="bg-gray-50 border border-gray-100 rounded-xl p-2 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-xs truncate">{item.name}</p>
                          <p className="font-black text-[#ff4d2d] text-xs">₹{item.price}</p>
                        </div>
                        <button
                          onClick={() => dispatch(addToCart({
                            id: item._id, name: item.name, price: item.price, image: item.image, shop: item.shop, quantity: 1, foodType: item.foodType
                          }))}
                          className="bg-[#ff4d2d] text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors flex-shrink-0 shadow-sm"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator — Dynamic multi-step UX */}
          {isLoading && (
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#ff4d2d] to-[#ff7a55] flex items-center justify-center flex-shrink-0">
                <MdAutoAwesome className="text-white text-[10px]" />
              </div>
              <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm min-w-[200px]">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 bg-[#ff4d2d] rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-[#ff4d2d] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 bg-[#ff4d2d] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                </div>
                <p className="text-xs font-bold text-gray-500 animate-pulse transition-all duration-300">
                  {loadingMessages[loadingStep]}
                </p>
              </div>
            </div>
          )}

          {/* Retry button — appears only after a failed request */}
          {lastFailedPrompt && !isLoading && (
            <div className="flex justify-center">
              <button onClick={handleRetry} className="flex items-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#ff4d2d] px-4 py-2 rounded-full text-xs font-bold transition-colors">
                <FaRedo className="text-[10px]" /> Retry Last Message
              </button>
            </div>
          )}

          {/* Quick prompt chips — shown only before the first message is sent */}
          {showQuickPrompts && messages.length === 1 && !isLoading && (
            <div className="mt-2 ml-8">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Questions</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.text)}
                    className="bg-white border border-gray-200 hover:border-[#ff4d2d] hover:text-[#ff4d2d] text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-1.5"
                  >
                    <span>{qp.icon}</span>{qp.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-100 rounded-b-[24px]">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about food…"
              maxLength={500}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#ff4d2d] focus:ring-2 focus:ring-[#ff4d2d]/10 transition-all font-medium"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1 w-9 h-9 flex items-center justify-center bg-[#ff4d2d] text-white rounded-lg disabled:opacity-40 hover:bg-orange-600 transition-all"
            >
              <FaPaperPlane className="text-xs ml-0.5" />
            </button>
          </div>
          <p className="text-center text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-2">
            Powered by Vingo AI
          </p>
        </form>
      </div>
    </>
  );
}
