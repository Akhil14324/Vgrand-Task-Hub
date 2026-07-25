import { useState, useRef, useEffect } from 'react';
import { Check, CheckCheck, MoreVertical, Trash2 } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

const DELETE_WINDOW_MS = 15 * 60 * 1000;

export default function MessageBubble({ message, isOwn, showAvatar, readBy, participants, onDeleteMessage }) {
  const { t, lang } = useLang();
  const isDeleted = !!(message.deletedAt || message.deleted_at);
  const displayName = message.senderName || message.sender_name || t('unknown');
  const createdAt = message.createdAt || message.created_at;
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const menuRef = useRef(null);

  const canDeleteForEveryone = (() => {
    if (isDeleted) return false;
    if (!isOwn) return false;
    const created = new Date(createdAt);
    if (isNaN(created.getTime())) return false;
    return Date.now() - created.getTime() <= DELETE_WINDOW_MS;
  })();

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const handleDelete = (scope) => {
    setShowMenu(false);
    setShowConfirm(scope);
  };

  const confirmDelete = () => {
    if (onDeleteMessage && showConfirm) {
      onDeleteMessage(message.id, showConfirm);
    }
    setShowConfirm(null);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString(lang === 'te' ? 'te-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const otherParticipantIds = (participants || []).filter((p) => p !== message.senderId);
  const allRead = isOwn && readBy && otherParticipantIds.length > 0 &&
    readBy.length >= otherParticipantIds.length;

  return (
    <div className={`group flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-[75%] sm:max-w-[60%] flex flex-col relative">
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-500 dark:text-gray-400 mb-0.5 px-2">{displayName}</span>
        )}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirm(null)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-4 max-w-xs w-full mx-4">
              <p className="text-sm text-gray-900 dark:text-gray-100 mb-4">
                {showConfirm === 'everyone'
                  ? t('deleteForEveryoneConfirm')
                  : t('deleteForMeConfirm')}
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
        <div
          className={`relative rounded-2xl px-3 py-2 pr-6 text-sm break-words ${
            isOwn
              ? 'bg-brand-600 text-white rounded-br-sm'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm'
          }`}
        >
        {!isDeleted && onDeleteMessage && (
          <button
            onClick={() => setShowMenu((v) => !v)}
            className={`absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 ${
              isOwn
                ? 'text-white/70 hover:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
            }`}
            title={t('messageOptions')}
          >
            <MoreVertical size={14} />
          </button>
        )}
        {showMenu && (
          <div
            ref={menuRef}
            className={`absolute top-6 z-30 ${isOwn ? 'right-0' : 'left-0'} bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[170px]`}
          >
            <button
              onClick={() => handleDelete('me')}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
            >
              <Trash2 size={14} /> {t('deleteForMe')}
            </button>
            {canDeleteForEveryone && (
              <button
                onClick={() => handleDelete('everyone')}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 whitespace-nowrap"
              >
                <Trash2 size={14} /> {t('deleteForEveryone')}
              </button>
            )}
          </div>
        )}

          {isDeleted ? (
            <span className="italic opacity-60">{t('messageDeleted')}</span>
          ) : (
            <>
              {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}
              {message.attachmentUrl && message.attachmentType?.startsWith('image/') && (
                <img
                  src={message.attachmentUrl}
                  alt={t('attachment')}
                  className="mt-1 rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
                  onClick={() => window.open(message.attachmentUrl, '_blank')}
                />
              )}
              {message.attachmentUrl && !message.attachmentType?.startsWith('image/') && (
                <a
                  href={message.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-1 underline ${isOwn ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`}
                >
                  {t('viewAttachment')}
                </a>
              )}
            </>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatTime(createdAt)}</span>
          {isOwn && !isDeleted && (
            allRead ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} className="text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}
