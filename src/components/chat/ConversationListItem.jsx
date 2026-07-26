import { useState, useRef, useEffect } from 'react';
import { Users, MoreVertical, Trash2, CheckCheck } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

export default function ConversationListItem({ conversation, currentUserId, onlineUsers, isActive, onClick, onDelete, onMarkRead }) {
  const { t, lang, getDynamic } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isGroup = conversation.type === 'group';
  const rawTitle =
    isGroup
      ? conversation.name
      : conversation.participants?.find((p) => String(p.id) !== String(currentUserId))?.name;
  const title = rawTitle ? getDynamic(rawTitle) : t('unknown');

  const lastMsg = conversation.last_message;
  const preview = lastMsg
    ? lastMsg.deleted_at
      ? t('messageDeleted')
      : lastMsg.body
        ? getDynamic(lastMsg.body)
        : (lastMsg.attachment_url ? `[${t('attachment')}]` : '')
    : t('noMessagesYet');

  const lastMsgTime = lastMsg?.created_at
    ? new Date(lastMsg.created_at).toLocaleTimeString(lang === 'te' ? 'te-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  const otherParticipant = !isGroup
    ? conversation.participants?.find((p) => String(p.id) !== String(currentUserId))
    : null;
  const isOnline = otherParticipant && onlineUsers.has(otherParticipant.id);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  const handleMenuClick = (e, action) => {
    e.stopPropagation();
    setMenuOpen(false);
    if (action === 'delete') onDelete?.(conversation.id);
    if (action === 'markRead') onMarkRead?.(conversation.id);
  };

  const hasUnread = conversation.unread_count > 0;
  const canMarkRead = hasUnread && onMarkRead;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left cursor-pointer ${
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{title}</span>
            {hasUnread && (
              <span className="flex-shrink-0 bg-brand-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
              </span>
            )}
          </div>
          {lastMsgTime && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{lastMsgTime}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{preview}</span>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              className="p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t('chatOptions')}
              aria-label={t('chatOptions')}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-30 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                {canMarkRead && (
                  <button
                    type="button"
                    onClick={(e) => handleMenuClick(e, 'markRead')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                  >
                    <CheckCheck size={14} /> {t('markAsRead')}
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => handleMenuClick(e, 'delete')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left"
                  >
                    <Trash2 size={14} /> {t('delete')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
