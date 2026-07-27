import { useEffect, useMemo, useState } from 'react';
import ConversationListItem from './ConversationListItem';
import { Plus } from 'lucide-react';
import { useLang } from '../../context/LanguageContext';

export default function ConversationList({
  conversations,
  currentUserId,
  onlineUsers,
  activeConversationId,
  onSelect,
  onNewConversation,
  onDelete,
  onMarkRead,
}) {
  const { t, lang, translateDynamic } = useLang();

  useEffect(() => {
    if (lang === 'en') return;
    const texts = [];
    conversations.forEach((conv) => {
      if (conv.type === 'group' && conv.name) texts.push(conv.name);
      conv.participants?.forEach((p) => { if (p.name) texts.push(p.name); });
      if (conv.last_message?.body) texts.push(conv.last_message.body);
    });
    const unique = [...new Set(texts)];
    if (unique.length > 0) translateDynamic(unique);
  }, [conversations, lang, translateDynamic]);

  const [activeTab, setActiveTab] = useState('users');
  const tabs = useMemo(
    () => [
      { key: 'users', type: 'direct', label: t('users') },
      { key: 'groups', type: 'group', label: t('groups') },
    ],
    [t]
  );
  const visibleConversations = useMemo(
    () => conversations.filter((c) => c.type === tabs.find((tab) => tab.key === activeTab).type),
    [conversations, activeTab, tabs]
  );

  const renderItem = (conv) => (
    <ConversationListItem
      key={conv.id}
      conversation={conv}
      currentUserId={currentUserId}
      onlineUsers={onlineUsers}
      isActive={conv.id === activeConversationId}
      onClick={() => onSelect(conv.id)}
      onDelete={onDelete}
      onMarkRead={onMarkRead}
    />
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('chat')}</h2>
        <button
          onClick={onNewConversation}
          className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          title={t('newConversation')}
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {visibleConversations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t('noConversations')}</p>
        ) : (
          visibleConversations.map(renderItem)
        )}
      </div>
    </div>
  );
}
