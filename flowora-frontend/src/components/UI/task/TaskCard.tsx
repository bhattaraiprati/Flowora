'use client';

import { Calendar, Clock, Flag, User } from 'lucide-react';
import { Task, TaskPriority } from '@/types/TaskInterface';

interface TaskCardProps {
  task: Task;
  compact?: boolean;
  onClick?: () => void;
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  LOW: { color: 'text-slate-600 bg-slate-100', label: 'Low' },
  MEDIUM: { color: 'text-blue-600 bg-blue-100', label: 'Medium' },
  HIGH: { color: 'text-amber-600 bg-amber-100', label: 'High' },
  URGENT: { color: 'text-red-600 bg-red-100', label: 'Urgent' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromEmail(email: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-teal-500',
  ];
  const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

function formatDueDate(dateStr: string): { text: string; isOverdue: boolean; isToday: boolean } {
  const dueDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isOverdue = diffDays < 0;
  const isToday = diffDays === 0;

  if (isToday) return { text: 'Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isToday: false };
  if (diffDays === -1) return { text: 'Yesterday', isOverdue: true, isToday: false };
  if (isOverdue) return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  if (diffDays <= 7) return { text: `${diffDays}d left`, isOverdue: false, isToday: false };

  return {
    text: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    isOverdue: false,
    isToday: false,
  };
}

export default function TaskCard({ task, compact = false, onClick }: TaskCardProps) {
  const priority = priorityConfig[task.priority];
  const dueInfo = task.due_date ? formatDueDate(task.due_date) : null;

  if (compact) {
    return (
      <div
        className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm text-slate-900 line-clamp-2">{task.title}</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priority.color}`}>
            {priority.label}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          {task.assignee && (
            <div className="flex items-center gap-1.5">
              {task.assignee.profile_picture ? (
                <img
                  src={task.assignee.profile_picture}
                  alt={task.assignee.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`w-5 h-5 rounded-full ${getColorFromEmail(task.assignee.email)} text-white text-[8px] font-bold flex items-center justify-center`}
                >
                  {getInitials(task.assignee.name)}
                </div>
              )}
            </div>
          )}

          {dueInfo && (
            <span
              className={`flex items-center gap-1 ${
                dueInfo.isOverdue
                  ? 'text-red-600'
                  : dueInfo.isToday
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className="font-semibold text-slate-900">{task.title}</h4>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${priority.color}`}>
          {priority.label}
        </span>
      </div>

      {task.description && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        {task.assignee ? (
          <div className="flex items-center gap-2">
            {task.assignee.profile_picture ? (
              <img
                src={task.assignee.profile_picture}
                alt={task.assignee.name}
                className="w-6 h-6 rounded-full object-cover"
                title={task.assignee.name}
              />
            ) : (
              <div
                className={`w-6 h-6 rounded-full ${getColorFromEmail(task.assignee.email)} text-white text-[10px] font-bold flex items-center justify-center`}
                title={task.assignee.name}
              >
                {getInitials(task.assignee.name)}
              </div>
            )}
            <span className="text-xs text-slate-600">{task.assignee.name.split(' ')[0]}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <User className="w-4 h-4" />
            Unassigned
          </div>
        )}

        {dueInfo && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              dueInfo.isOverdue
                ? 'text-red-600 font-medium'
                : dueInfo.isToday
                ? 'text-amber-600 font-medium'
                : 'text-slate-500'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            {dueInfo.text}
          </div>
        )}
      </div>

      {task.estimated_hours && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
          <Clock className="w-3.5 h-3.5" />
          {task.estimated_hours}h estimated
        </div>
      )}
    </div>
  );
}
