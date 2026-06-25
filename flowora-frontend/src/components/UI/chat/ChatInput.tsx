'use client';

import { Send, Paperclip, Smile, AtSign } from 'lucide-react';
import { KeyboardEvent } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
}: ChatInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="flex items-end gap-3">
      {/* Attachments Button */}
      <button
        className="p-2.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 mb-1"
        title="Attach file"
        disabled={disabled}
      >
        <Paperclip className="w-5 h-5 text-slate-500" />
      </button>

      {/* Input Container */}
      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 pr-24 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent resize-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            minHeight: '44px',
            maxHeight: '120px',
          }}
        />

        {/* Inline Actions */}
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <button
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
            title="Mention someone"
            disabled={disabled}
          >
            <AtSign className="w-4 h-4 text-slate-500" />
          </button>
          <button
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
            title="Add emoji"
            disabled={disabled}
          >
            <Smile className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Send Button */}
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        className="p-2.5 bg-brand hover:bg-brand-dark text-white rounded-lg transition-all flex-shrink-0 mb-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand"
        title="Send message (Enter)"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
