'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessagesSquare, Hash, Flag, Search, ArrowDown, Check, CheckCheck, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { messagerieApi } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';
import { EmptyState } from '@/components/shared/empty-state';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import type { CanalDiscussion, Message } from '@/types';

const TYPING_IDLE_MS = 3000;
const SCROLL_BOTTOM_THRESHOLD_PX = 80;

export default function MessageriePage() {
  const { user } = useAuth();
  const [canalActif, setCanalActif] = useState<CanalDiscussion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [rechercheCanal, setRechercheCanal] = useState('');
  const [typeurs, setTypeurs] = useState<Map<string, string>>(new Map()); // userId -> prenom
  const [presence, setPresence] = useState(1);
  const [isConnected, setIsConnected] = useState(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [messageASignaler, setMessageASignaler] = useState<Message | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const lastTypingEmitRef = useRef(0);

  const { data: canaux, isLoading } = useQuery({
    queryKey: ['messagerie', 'canaux'],
    queryFn: () => messagerieApi.canaux().then((r) => r.data.data as CanalDiscussion[]),
  });

  const canauxFiltres = useMemo(
    () => canaux?.filter((c) => c.nom.toLowerCase().includes(rechercheCanal.toLowerCase())) ?? [],
    [canaux, rechercheCanal],
  );

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setShowJumpToBottom(false);
  }, []);

  // Chargement de l'historique + abonnement aux événements du canal actif
  useEffect(() => {
    if (!canalActif) return;
    let active = true;

    messagerieApi.historique(canalActif.id).then((r) => {
      if (active) {
        setMessages(r.data.data as Message[]);
        requestAnimationFrame(() => scrollToBottom('auto'));
      }
    });

    const socket = getSocket();
    socket?.emit('canal:join', canalActif.id);

    function onNewMessage(msg: Message) {
      if (msg.canalId !== canalActif?.id) return;
      setMessages((prev) => [...prev, msg]);
      if (isAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom());
      } else {
        setShowJumpToBottom(true);
      }
    }

    function onFlagged({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, estSignale: true } : m)));
    }

    function onTyping({ userId, prenom }: { userId: string; prenom: string }) {
      if (userId === user?.id) return;
      setTypeurs((prev) => new Map(prev).set(userId, prenom));
      setTimeout(() => {
        setTypeurs((prev) => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }, TYPING_IDLE_MS);
    }

    function onPresence(payload: { canalId: string; count: number }) {
      if (payload.canalId === canalActif?.id) setPresence(payload.count);
    }

    socket?.on('message:new', onNewMessage);
    socket?.on('message:flagged', onFlagged);
    socket?.on('canal:typing', onTyping);
    socket?.on('canal:presence', onPresence);

    return () => {
      active = false;
      socket?.emit('canal:leave', canalActif.id);
      socket?.off('message:new', onNewMessage);
      socket?.off('message:flagged', onFlagged);
      socket?.off('canal:typing', onTyping);
      socket?.off('canal:presence', onPresence);
      setTypeurs(new Map());
      setShowJumpToBottom(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canalActif?.id]);

  // Reconnexion : réintègre automatiquement la room du canal actif
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onConnect() {
      setIsConnected(true);
      if (canalActif) socket?.emit('canal:join', canalActif.id);
    }
    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canalActif?.id]);

  function handleScroll() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD_PX;
    isAtBottomRef.current = atBottom;
    if (atBottom) setShowJumpToBottom(false);
  }

  function emitTyping() {
    if (!canalActif || !user) return;
    const now = Date.now();
    if (now - lastTypingEmitRef.current < 1500) return; // throttle
    lastTypingEmitRef.current = now;
    getSocket()?.emit('canal:typing', { canalId: canalActif.id, prenom: user.prenom });
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !canalActif) return;
    const socket = getSocket();
    socket?.emit('message:send', { canalId: canalActif.id, contenu: input }, (res: { success: boolean; error?: string }) => {
      if (!res.success) toast.error(res.error ?? "Échec de l'envoi");
    });
    setInput('');
    clearTimeout(typingTimeoutRef.current);
  }

  function confirmerSignalement() {
    if (!messageASignaler || !canalActif) return;
    const socket = getSocket();
    socket?.emit('message:signaler', { canalId: canalActif.id, messageId: messageASignaler.id }, (res: { success: boolean }) => {
      if (res.success) toast.success('Message signalé aux modérateurs');
      setMessageASignaler(null);
    });
  }

  const typeursListe = Array.from(typeurs.values());

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="flex flex-col overflow-hidden p-2">
        <div className="relative mb-2 px-1 pt-1">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={rechercheCanal}
            onChange={(e) => setRechercheCanal(e.target.value)}
            placeholder="Rechercher un canal..."
            className="h-9 pl-8 text-sm"
          />
        </div>
        <p className="px-2 py-1 text-xs font-semibold uppercase text-muted-foreground">Canaux</p>
        <div className="flex-1 overflow-y-auto">
          {isLoading && <p className="px-2 text-sm text-muted-foreground">Chargement...</p>}
          {canauxFiltres.length === 0 && !isLoading && <p className="px-2 text-sm text-muted-foreground">Aucun canal trouvé</p>}
          {canauxFiltres.map((c) => (
            <button
              key={c.id}
              onClick={() => setCanalActif(c)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                canalActif?.id === c.id ? 'bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              <Hash className="h-4 w-4 shrink-0" /> <span className="truncate">{c.nom}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="relative flex flex-col overflow-hidden">
        {!canalActif ? (
          <EmptyState icon={MessagesSquare} title="Sélectionnez un canal" description="Choisissez un canal de module pour commencer à discuter." className="h-full border-0" />
        ) : (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <p className="font-medium">{canalActif.nom}</p>
                <p className="text-xs text-muted-foreground">
                  {presence > 1 ? `${presence} personnes connectées` : 'Vous seul(e) êtes connecté(e)'}
                </p>
              </div>
              {!isConnected && (
                <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <WifiOff className="h-3 w-3" /> Reconnexion...
                </span>
              )}
            </div>

            <div ref={scrollContainerRef} onScroll={handleScroll} className="relative flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => {
                const isMine = m.auteur.id === user?.id;
                const precedent = messages[i - 1];
                const afficherEnTete = !precedent || precedent.auteur.id !== m.auteur.id ||
                  new Date(m.createdAt).getTime() - new Date(precedent.createdAt).getTime() > 5 * 60_000;

                return (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn('group flex gap-2', isMine && 'flex-row-reverse')}>
                    <Avatar className={cn('h-7 w-7 shrink-0', !afficherEnTete && 'invisible')}>
                      <AvatarFallback className="text-[10px]">{getInitials(m.auteur.nom, m.auteur.prenom)}</AvatarFallback>
                    </Avatar>
                    <div className={cn('max-w-[75%]', isMine && 'items-end text-right')}>
                      {afficherEnTete && !isMine && (
                        <p className="mb-0.5 px-1 text-[11px] font-medium text-muted-foreground">{m.auteur.prenom} {m.auteur.nom}</p>
                      )}
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2 text-sm',
                          isMine ? 'bg-primary text-primary-foreground' : 'bg-muted',
                          m.estSignale && 'opacity-60',
                        )}
                      >
                        {m.estSignale ? <em className="text-xs">Message signalé — contenu masqué</em> : m.contenu}
                      </div>
                      <div className={cn('mt-0.5 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground', isMine && 'justify-end')}>
                        <span>{formatRelativeTime(m.createdAt)}</span>
                        {isMine && (presence > 1 ? <CheckCheck className="h-3 w-3 text-primary" /> : <Check className="h-3 w-3" />)}
                        {!isMine && !m.estSignale && (
                          <button onClick={() => setMessageASignaler(m)} className="opacity-0 transition-opacity group-hover:opacity-100" aria-label="Signaler">
                            <Flag className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {typeursListe.length > 0 && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-1 text-xs italic text-muted-foreground">
                    {typeursListe.join(', ')} {typeursListe.length > 1 ? 'sont en train d\'écrire...' : 'est en train d\'écrire...'}
                  </motion.p>
                )}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            <AnimatePresence>
              {showJumpToBottom && (
                <motion.button
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  onClick={() => scrollToBottom()}
                  className="absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-lg"
                >
                  <ArrowDown className="h-3 w-3" /> Nouveaux messages
                </motion.button>
              )}
            </AnimatePresence>

            <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
              <Input
                value={input}
                onChange={(e) => { setInput(e.target.value); emitTyping(); }}
                placeholder="Votre message..."
              />
              <Button type="submit" size="icon" disabled={!input.trim()}><Send className="h-4 w-4" /></Button>
            </form>
          </>
        )}
      </Card>

      <Dialog open={!!messageASignaler} onOpenChange={(o) => !o && setMessageASignaler(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signaler ce message ?</DialogTitle>
            <DialogDescription>
              Ce message sera masqué et signalé aux modérateurs pour vérification. Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          {messageASignaler && (
            <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              « {messageASignaler.contenu} » — {messageASignaler.auteur.prenom} {messageASignaler.auteur.nom}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageASignaler(null)}>Annuler</Button>
            <Button variant="destructive" onClick={confirmerSignalement}>Signaler</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
