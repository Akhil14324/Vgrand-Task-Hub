import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import ConversationList from '../components/chat/ConversationList';
import MessageThread from '../components/chat/MessageThread';
import NewConversationModal from '../components/chat/NewConversationModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    conversations,
    activeConversationId,
    messages,
    typingUsers,
    onlineUsers,
    totalUnread,
    connected,
    fetchConversations,
    loadMessages,
    sendMessage,
    markRead,
    sendTypingStart,
    sendTypingStop,
    createConversation,
    deleteConversation,
    deleteMessage,
    uploadFile,
    setActiveConversation,
  } = useChat();

  const [showNewModal, setShowNewModal] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [showThreadMobile, setShowThreadMobile] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (conversationId) {
      const id = parseInt(conversationId);
      setActiveConversation(id);
      setShowThreadMobile(true);
      loadMessages(id).then(setHasMore);
    } else {
      setActiveConversation(null);
      setShowThreadMobile(false);
    }
  }, [conversationId, setActiveConversation, loadMessages]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const activeTyping = typingUsers[activeConversationId] || [];

  const handleSelect = (id) => {
    navigate(`/chat/${id}`);
  };

  const handleBack = () => {
    navigate('/chat');
  };

  const handleSend = async (body, file) => {
    if (!activeConversationId) return;
    let attachmentUrl = null;
    let attachmentType = null;
    if (file) {
      try {
        const result = await uploadFile(file);
        attachmentUrl = result.url;
        attachmentType = result.type;
      } catch {
        return;
      }
    }
    try {
      await sendMessage(activeConversationId, body, attachmentUrl, attachmentType);
    } catch {
      // fallback already handled in context
    }
  };

  const handleLoadMore = async () => {
    if (!activeConversationId || messages.length === 0) return;
    const firstMsgId = messages[0].id;
    const more = await loadMessages(activeConversationId, firstMsgId);
    setHasMore(more);
  };

  const handleMarkRead = (messageId) => {
    if (activeConversationId) {
      markRead(activeConversationId, messageId);
    }
  };

  const handleMarkConversationRead = async (conversationId) => {
    const conv = conversations.find((c) => c.id === conversationId);
    const lastMsg = conv?.last_message;
    if (lastMsg && conv?.unread_count > 0) {
      await markRead(conversationId, lastMsg.id);
      await fetchConversations();
    }
  };

  const handleCreate = async (type, participantIds, name) => {
    const conv = await createConversation(type, participantIds, name);
    navigate(`/chat/${conv.id}`);
  };

  const handleDeleteMessage = async (messageId, scope) => {
    await deleteMessage(messageId, scope);
  };

  const [deleteConvId, setDeleteConvId] = useState(null);

  const handleDelete = (conversationId) => {
    setDeleteConvId(conversationId);
  };

  const confirmDeleteConversation = async () => {
    const conversationId = deleteConvId;
    setDeleteConvId(null);
    if (!conversationId) return;
    await deleteConversation(conversationId);
    if (activeConversationId === conversationId) {
      navigate('/chat');
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-screen -m-4 sm:-m-6 lg:-m-8">
      <div className={`w-full lg:w-80 lg:flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${showThreadMobile && activeConversationId ? 'hidden lg:flex' : 'flex'} flex-col`}>
        <ConversationList
          conversations={conversations}
          currentUserId={user?.id}
          onlineUsers={onlineUsers}
          activeConversationId={activeConversationId}
          onSelect={handleSelect}
          onNewConversation={() => setShowNewModal(true)}
          onDelete={handleDelete}
          onMarkRead={handleMarkConversationRead}
        />
      </div>
      <div className={`flex-1 ${!showThreadMobile && !activeConversationId ? 'hidden lg:flex' : 'flex'} flex-col`}>
        <MessageThread
          conversation={activeConversation}
          activeConversationId={activeConversationId}
          messages={messages}
          typingUsers={activeTyping}
          currentUserId={user?.id}
          onlineUsers={onlineUsers}
          onSend={handleSend}
          onTypingStart={() => sendTypingStart(activeConversationId)}
          onTypingStop={() => sendTypingStop(activeConversationId)}
          onMarkRead={handleMarkRead}
          onLoadMore={handleLoadMore}
          onBack={handleBack}
          hasMore={hasMore}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
      <NewConversationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleCreate}
      />
      <ConfirmDialog
        open={deleteConvId !== null}
        title="Delete Chat"
        message="Delete this chat? This will remove it from your list."
        onConfirm={confirmDeleteConversation}
        onCancel={() => setDeleteConvId(null)}
      />
    </div>
  );
}
