export default function TypingIndicator({ typingUsers, currentUserId }) {
  const active = typingUsers.filter((u) => u.userId !== currentUserId);
  if (active.length === 0) return null;

  const names = active.map((u) => u.userName).join(', ');
  const text = active.length === 1 ? `${names} is typing...` : `${names} are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-gray-500 dark:text-gray-400">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>{text}</span>
    </div>
  );
}
