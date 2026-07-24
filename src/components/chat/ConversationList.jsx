import ConversationListItem from './ConversationListItem';
import { MessageSquare, Plus } from 'lucide-react';

export default function ConversationList({
  conversations,
  currentUserId,
  onlineUsers,
  activeConversationId,
  onSelect,
  onNewConversation,
  onDelete,
}) {
  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MessageSquare size={40} className="text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">No conversations yet</p>
        <button
          onClick={onNewConversation}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          <Plus size={18} />
          Start a chat
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Chats</h2>
        <button
          onClick={onNewConversation}
          className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          title="New conversation"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.map((conv) => (
          <ConversationListItem
            key={conv.id}
            conversation={conv}
            currentUserId={currentUserId}
            onlineUsers={onlineUsers}
            isActive={conv.id === activeConversationId}
            onClick={() => onSelect(conv.id)}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
