import { useEffect, useRef, useState, useMemo } from 'react';
import { useLang } from '../../context/LanguageContext';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { ArrowLeft, Users } from 'lucide-react';

function getDayKey(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-CA');
}

function formatDateLabel(dateStr, lang, t) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t('today');
  if (diffDays === 1) return t('yesterday');
  const locale = lang === 'te' ? 'te-IN' : 'en-GB';
  return msgDay.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function normalizeMessage(m) {
  return {
    ...m,
    id: Number(m.id),
    conversationId: Number(m.conversation_id ?? m.conversationId),
    senderId: Number(m.sender_id ?? m.senderId),
    senderName: m.sender_name ?? m.senderName ?? 'Unknown',
    body: m.body,
    attachmentUrl: m.attachment_url ?? m.attachmentUrl,
    attachmentType: m.attachment_type ?? m.attachmentType,
    createdAt: m.created_at ?? m.createdAt,
    editedAt: m.edited_at ?? m.editedAt,
    deletedAt: m.deleted_at ?? m.deletedAt,
    readBy: m.readBy || [],
  };
}

export default function MessageThread({
  conversation,
  activeConversationId,
  messages,
  typingUsers,
  currentUserId,
  onlineUsers,
  onSend,
  onTypingStart,
  onTypingStop,
  onMarkRead,
  onLoadMore,
  onBack,
  hasMore,
  onDeleteMessage,
}) {
  const { t, lang, translateDynamic, getDynamic } = useLang();
  const scrollRef = useRef(null);
  const lastMarkedRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const normalizedMessages = useMemo(() => messages.map(normalizeMessage), [messages]);

  useEffect(() => {
    if (lang === 'en') return;
    const texts = [];
    normalizedMessages.forEach((m) => {
      if (m.body) texts.push(m.body);
      if (m.senderName) texts.push(m.senderName);
    });
    if (conversation?.type === 'group' && conversation?.name) texts.push(conversation.name);
    (conversation?.participants || []).forEach((p) => { if (p.name) texts.push(p.name); });
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [lang, normalizedMessages, conversation, translateDynamic]);

  useEffect(() => {
    if (loadingMoreRef.current) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    lastMarkedRef.current = null;
  }, [activeConversationId]);

  useEffect(() => {
    if (normalizedMessages.length > 0) {
      // Mark the latest message from another user as read (marks all prior ones too)
      const lastOtherMsg = [...normalizedMessages].reverse().find((m) => m.senderId !== currentUserId);
      if (lastOtherMsg && lastMarkedRef.current !== lastOtherMsg.id) {
        lastMarkedRef.current = lastOtherMsg.id;
        onMarkRead?.(lastOtherMsg.id);
      }
    }
  }, [normalizedMessages, currentUserId, onMarkRead]);

  const handleScroll = async () => {
    if (scrollRef.current && scrollRef.current.scrollTop < 50 && hasMore && !loadingMore) {
      setLoadingMore(true);
      loadingMoreRef.current = true;
      const prevHeight = scrollRef.current.scrollHeight;
      await onLoadMore?.();
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        }
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
    }
  };

  if (!conversation && normalizedMessages.length === 0) {
    if (activeConversationId) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto mb-3" />
            <p>{t('loading') || 'Loading...'}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>{t('selectConversation')}</p>
        </div>
      </div>
    );
  }

  const otherParticipants = conversation?.participants?.filter((p) => String(p.id) !== String(currentUserId)) || [];
  const conversationTitle =
    getDynamic(
      conversation?.type === 'group'
        ? conversation?.name
        : otherParticipants[0]?.name || ''
    ) || t('direct');
  const isOtherOnline = otherParticipants.length > 0 && otherParticipants.some((p) => onlineUsers.has(p.id));

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{conversationTitle}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {conversation?.type === 'group'
              ? `${conversation?.participants?.length || 0} ${t('members')}`
              : isOtherOnline
                ? t('online')
                : t('offline')}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-900"
      >
        {loadingMore && (
          <div className="text-center text-xs text-gray-400 py-2">{t('loadingOlder')}</div>
        )}
        {messages.length === 0 && !loadingMore && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
            {t('noMessagesYet')}
          </div>
        )}
        {normalizedMessages.flatMap((msg, idx) => {
          const prevMsg = normalizedMessages[idx - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
          const currentDay = getDayKey(msg.createdAt);
          const prevDay = prevMsg ? getDayKey(prevMsg.createdAt) : null;
          const showDateHeader = idx === 0 || currentDay !== prevDay;
          const items = [];
          if (showDateHeader) {
            items.push(
              <div key={`date-${currentDay}-${msg.id}`} className="flex justify-center my-4">
                <div className="px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-xs text-amber-800 dark:text-amber-100 shadow-sm">
                  {formatDateLabel(msg.createdAt, lang, t)}
                </div>
              </div>
            );
          }
          items.push(
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              showAvatar={showAvatar}
              readBy={msg.readBy}
              participants={conversation?.participants?.map((p) => p.id)}
              onDeleteMessage={onDeleteMessage}
            />
          );
          return items;
        })}
        <TypingIndicator typingUsers={typingUsers} currentUserId={currentUserId} />
      </div>

      <div className="flex-shrink-0">
        <MessageInput
          onSend={onSend}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
          disabled={false}
        />
      </div>
    </div>
  );
}
