'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, FileText, AlertTriangle, Brain, Bot, User as UserIcon, History, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { iaApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { ChatMessage, PaginatedResponse } from '@/types';

interface InteractionIA {
  id: string;
  question: string | null;
  reponse: string | null;
  sourcesJson: unknown;
  createdAt: string;
}

const SUGGESTIONS = [
  'Résume les notions clés de mon dernier cours',
  "Qu'est-ce que l'architecture 3-tiers ?",
  'Quels sont les patrons de conception courants ?',
];

const MD_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => <h3 className="mb-1 mt-3 text-base font-bold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h4 className="mb-1 mt-3 text-sm font-bold first:mt-0">{children}</h4>,
  h3: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h5>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) =>
    className ? (
      <code className="my-2 block overflow-x-auto rounded bg-muted px-3 py-2 font-mono text-xs">{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
    ),
  pre: ({ children }) => <pre className="my-2 overflow-x-auto rounded bg-muted p-0">{children}</pre>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-primary/40 pl-3 italic text-muted-foreground">{children}</blockquote>,
};

export default function ChatbotPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistorique, setShowHistorique] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: historique, isLoading: loadingHistorique } = useQuery({
    queryKey: ['ia', 'historique-chat'],
    queryFn: () => iaApi.listHistoriqueChat({ pageSize: 20 }).then((r) => r.data as PaginatedResponse<InteractionIA>),
    enabled: showHistorique,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function sendMessage(question: string) {
    if (!question.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await iaApi.chat(question);
      const result = data.data as { reponse: string; sources: ChatMessage['sources']; modeReponse: ChatMessage['modeReponse']; modeDegrade: boolean };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.reponse,
          sources: result.sources,
          modeReponse: result.modeReponse,
          modeDegrade: result.modeDegrade,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch {
      toast.error('Le chatbot est temporairement indisponible, veuillez réessayer');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }

  function chargerConversation(item: InteractionIA) {
    if (!item.question || !item.reponse) return;
    setMessages([
      { role: 'user', content: item.question, timestamp: item.createdAt },
      { role: 'assistant', content: item.reponse, timestamp: item.createdAt },
    ]);
    setShowHistorique(false);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      {/* En-tête */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h1 className="font-bold leading-tight">Assistant IA EduSmart</h1>
            <p className="text-xs text-muted-foreground">Basé sur vos cours, complété par les connaissances générales de l&apos;IA si besoin</p>
          </div>
        </div>
        <button
          onClick={() => setShowHistorique((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent"
        >
          <History className="h-3.5 w-3.5" />
          Historique
          {showHistorique ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Panneau historique */}
      <AnimatePresence>
        {showHistorique && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden rounded-lg border bg-card"
          >
            <div className="max-h-56 overflow-y-auto p-2">
              <p className="mb-2 px-1 text-xs font-semibold uppercase text-muted-foreground">Conversations précédentes</p>
              {loadingHistorique && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="mb-2 h-12 w-full" />)}
              {historique?.data.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Aucune conversation précédente</p>
              )}
              {historique?.data.map((item) => (
                <button
                  key={item.id}
                  onClick={() => chargerConversation(item)}
                  className="mb-1 flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-accent"
                >
                  <Bot className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{item.question}</p>
                    <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone de chat */}
      <div className="flex-1 space-y-4 overflow-y-auto pb-4 pr-1">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium">Posez votre première question</p>
              <p className="text-sm text-muted-foreground">L&apos;assistant cherche dans vos cours indexés pour vous répondre.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                {m.role === 'user' ? (user ? getInitials(user.nom, user.prenom) : <UserIcon className="h-4 w-4" />) : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                <Card className={m.role === 'user' ? 'bg-primary text-primary-foreground' : ''}>
                  <div className={`p-3 text-sm leading-relaxed ${m.role === 'user' ? 'text-primary-foreground' : ''}`}>
                    {m.role === 'user' ? (
                      <span className="whitespace-pre-wrap">{m.content}</span>
                    ) : (
                      <ReactMarkdown components={MD_COMPONENTS}>{m.content}</ReactMarkdown>
                    )}
                  </div>
                </Card>
                {m.modeDegrade && (
                  <Badge variant="warning" className="gap-1"><AlertTriangle className="h-3 w-3" /> Mode dégradé</Badge>
                )}
                {!m.modeDegrade && m.role === 'assistant' && m.modeReponse === 'CONNAISSANCES_GENERALES' && (
                  <Badge variant="secondary" className="gap-1"><Brain className="h-3 w-3" /> Connaissances générales de l&apos;IA</Badge>
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.sources.map((s, si) => (
                      <Badge key={si} variant="outline" className="gap-1 text-[11px]">
                        <FileText className="h-3 w-3" /> {s.titre} · {(s.score * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot className="h-4 w-4" /></div>
            <Card><div className="flex gap-1 p-3"><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" /></div></Card>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
        className="flex items-end gap-2 border-t bg-background pt-3"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Posez votre question sur vos cours..."
          className="min-h-[44px] flex-1 resize-none"
          rows={1}
        />
        <Button type="submit" size="icon" loading={isLoading} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
