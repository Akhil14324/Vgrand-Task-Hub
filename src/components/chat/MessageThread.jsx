import { useEffect, useRef, useState, useMemo } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { ArrowLeft, Users } from 'lucide-react';

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
  const scrollRef = useRef(null);
  const lastMarkedRef = useRef(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const normalizedMessages = useMemo(() => messages.map(normalizeMessage), [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    if (normalizedMessages.length > 0) {
      const lastMsg = normalizedMessages[normalizedMessages.length - 1];
      if (lastMsg.senderId !== currentUserId && lastMarkedRef.current !== lastMsg.id) {
        lastMarkedRef.current = lastMsg.id;
        onMarkRead?.(lastMsg.id);
      }
    }
  }, [normalizedMessages, currentUserId, onMarkRead]);

  const handleScroll = async () => {
    if (scrollRef.current && scrollRef.current.scrollTop < 50 && hasMore && !loadingMore) {
      setLoadingMore(true);
      const prevHeight = scrollRef.current.scrollHeight;
      await onLoadMore?.();
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevHeight;
        }
      });
      setLoadingMore(false);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">
        <div className="text-center">
          <Users size={48} className="mx-auto mb-3 opacity-50" />
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );
  }

  const conversationTitle =
    conversation.type === 'group'
      ? conversation.name
      : conversation.participants?.find((p) => p.id !== currentUserId)?.name || 'Direct Chat';

  const otherParticipants = conversation.participants?.filter((p) => p.id !== currentUserId) || [];
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
            {conversation.type === 'group'
              ? `${conversation.participants?.length || 0} members`
              : isOtherOnline
                ? 'Online'
                : 'Offline'}
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-900"
      >
        {loadingMore && (
          <div className="text-center text-xs text-gray-400 py-2">Loading older messages...</div>
        )}
        {messages.length === 0 && !loadingMore && (
          <div className="text-center text-sm text-gray-400 dark:text-gray-500 py-8">
            No messages yet. Say hello!
          </div>
        )}
        {normalizedMessages.map((msg, idx) => {
          const prevMsg = normalizedMessages[idx - 1];
          const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUserId}
              showAvatar={showAvatar}
              readBy={msg.readBy}
              participants={conversation.participants?.map((p) => p.id)}
              onDeleteMessage={onDeleteMessage}
            />
          );
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
