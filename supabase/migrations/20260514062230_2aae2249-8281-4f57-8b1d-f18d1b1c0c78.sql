
-- AI Chatbot conversations & messages
CREATE TABLE public.chatbot_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_key TEXT,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.chatbot_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chatbot_messages_conv ON public.chatbot_messages(conversation_id, created_at);
CREATE INDEX idx_chatbot_conversations_user ON public.chatbot_conversations(user_id);

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users manage their own conversations; guests use edge function with session_key
CREATE POLICY "users view own conversations" ON public.chatbot_conversations
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "users insert own conversations" ON public.chatbot_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "users update own conversations" ON public.chatbot_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users delete own conversations" ON public.chatbot_conversations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users view own messages" ON public.chatbot_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chatbot_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR has_role(auth.uid(),'admin')))
  );
CREATE POLICY "users insert own messages" ON public.chatbot_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.chatbot_conversations c WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR c.user_id IS NULL))
  );

CREATE TRIGGER update_chatbot_conversations_updated_at
BEFORE UPDATE ON public.chatbot_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI cache for review summaries & recommendations (avoid recomputation)
CREATE TABLE public.ai_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_cache_key ON public.ai_cache(cache_key);
CREATE INDEX idx_ai_cache_kind ON public.ai_cache(kind);

ALTER TABLE public.ai_cache ENABLE ROW LEVEL SECURITY;

-- Cache is publicly readable (review summaries shown to all visitors)
CREATE POLICY "ai cache readable by all" ON public.ai_cache
  FOR SELECT USING (true);
-- Only admins can manage directly; edge functions use service role
CREATE POLICY "admins manage ai cache" ON public.ai_cache
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
