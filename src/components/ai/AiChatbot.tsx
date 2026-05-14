import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = "peakpower_chatbot_messages";

const AiChatbot = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages([...newMessages, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantText };
                return copy;
              });
            }
          } catch { /* ignore parse errors on partial chunks */ }
        }
      }

      if (!assistantText) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Sorry, I couldn't generate a reply. Please try again." };
          return copy;
        });
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Chat error", description: e.message || "Try again" });
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Launcher */}
      <motion.button
        onClick={() => setOpen(true)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-24 right-6 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-gold to-amber-500 shadow-lg shadow-gold/30 flex items-center justify-center text-background ${open ? "hidden" : ""}`}
        aria-label="Open AI assistant"
      >
        <Sparkles className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-background animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-96 h-[32rem] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-gold/10 to-amber-500/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-amber-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-background" />
                </div>
                <div>
                  <p className="font-semibold text-sm">PeakPower Assistant</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1">
                    Clear
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8 px-4">
                  <Bot className="w-10 h-10 text-gold mx-auto mb-3" />
                  <p className="font-medium text-sm mb-1">Salaam! 👋</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Ask me anything in Urdu or English — products, orders, delivery, or Shilajit benefits.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Shilajit kya hai?", "How long delivery?", "Track my order"].map(s => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-gold/20 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gold/20 text-gold"
                  }`}>
                    {m.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}>
                    {m.content || (streaming && i === messages.length - 1 ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null)}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Type your message..."
                  disabled={streaming}
                  className="flex-1 bg-muted rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 disabled:opacity-60"
                />
                <button
                  onClick={send}
                  disabled={!input.trim() || streaming}
                  className="w-9 h-9 rounded-full bg-gold text-background flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChatbot;
