'use client';

interface ChatNotificationBadgeProps {
  count: number;
  className?: string;
}

export default function ChatNotificationBadge({
  count,
  className = '',
}: ChatNotificationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
