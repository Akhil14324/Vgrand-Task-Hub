import { Users, Trash2 } from 'lucide-react';

export default function ConversationListItem({ conversation, currentUserId, onlineUsers, isActive, onClick, onDelete }) {
  const isGroup = conversation.type === 'group';
  const title =
    isGroup
      ? conversation.name
      : conversation.participants?.find((p) => p.id !== currentUserId)?.name || 'Unknown';

  const lastMsg = conversation.last_message;
  const preview = lastMsg
    ? lastMsg.deleted_at
      ? 'This message was deleted'
      : lastMsg.body || (lastMsg.attachment_url ? '[Attachment]' : '')
    : 'No messages yet';

  const lastMsgTime = lastMsg?.created_at
    ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const otherParticipant = !isGroup
    ? conversation.participants?.find((p) => p.id !== currentUserId)
    : null;
  const isOnline = otherParticipant && onlineUsers.has(otherParticipant.id);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
        isActive
          ? 'bg-brand-50 dark:bg-brand-900/20'
          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      <div className="relative flex-shrink-0">
        {isGroup ? (
          <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Users size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="w-11 h-11 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-sm font-semibold text-brand-700 dark:text-brand-300">
            {title?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{title}</span>
          {lastMsgTime && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{lastMsgTime}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{preview}</span>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conversation.id);
              }}
              className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete chat"
              aria-label="Delete chat"
            >
              <Trash2 size={14} />
            </button>
          )}
          {conversation.unread_count > 0 && (
            <span className="flex-shrink-0 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
