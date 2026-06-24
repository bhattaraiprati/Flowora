'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Task } from '@/types/TaskInterface';
import { taskApi } from '@/lib/api';
import TaskCard from './TaskCard';
import { TaskDetailsModal } from '@/components/modal/TaskDetailsModal';

interface CalendarViewProps {
  tasks: Task[];
  projectId: string;
}

export default function CalendarView({ tasks, projectId }: CalendarViewProps) {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, date }: { taskId: string; date: string }) =>
      taskApi.updateTaskDate(taskId, date, 'due_date'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());

    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [currentDate]);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return tasks.filter((task) => {
      if (!task.due_date) return false;
      const taskDate = task.due_date.split('T')[0];
      return taskDate === dateStr;
    });
  };

  const getUnscheduledTasks = () => {
    return tasks.filter((task) => !task.due_date);
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(date);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault();
    setDragOverDate(null);

    if (draggedTask) {
      const taskDate = draggedTask.due_date?.split('T')[0];
      if (taskDate !== date) {
        updateTaskMutation.mutate({ taskId: draggedTask.id, date });
      }
    }
    setDraggedTask(null);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const unscheduledTasks = getUnscheduledTasks();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="text-lg font-semibold text-slate-900">
          {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Unscheduled Column */}
        <div className="w-64 border-r border-slate-100 flex-shrink-0 flex flex-col bg-slate-50">
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <h3 className="font-semibold text-slate-900">Unscheduled</h3>
            <span className="text-sm text-slate-500">{unscheduledTasks.length} tasks</span>
          </div>
          <div
            className="flex-1 p-3 space-y-2 overflow-y-auto"
            onDragOver={(e) => handleDragOver(e, '')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, '')}
          >
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className="cursor-move"
              >
                <TaskCard task={task} compact onClick={() => handleTaskClick(task)} />
              </div>
            ))}
          </div>
        </div>

        {/* Week Days Columns */}
        <div className="flex-1 flex overflow-x-auto">
          {weekDays.map((day) => {
            const dateStr = formatDate(day);
            const dayTasks = getTasksForDate(day);
            const isDragOver = dragOverDate === dateStr;
            const isTodayDate = isToday(day);

            return (
              <div
                key={dateStr}
                className="flex-1 min-w-[200px] border-r border-slate-100 flex flex-col"
                onDragOver={(e) => handleDragOver(e, dateStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, dateStr)}
              >
                {/* Day Header */}
                <div className={`px-4 py-3 border-b border-slate-100 ${isTodayDate ? 'bg-brand-light' : 'bg-white'}`}>
                  <div className="text-sm font-medium text-slate-600">{formatDayName(day)}</div>
                  <div className={`text-lg font-semibold ${isTodayDate ? 'text-brand' : 'text-slate-900'}`}>
                    {formatDisplayDate(day).split(' ')[1]}
                  </div>
                  <span className="text-xs text-slate-500">{dayTasks.length} tasks</span>
                </div>

                {/* Day Content */}
                <div
                  className={`flex-1 p-3 space-y-2 overflow-y-auto transition-all ${
                    isDragOver ? 'bg-brand-light ring-2 ring-brand ring-inset' : 'bg-white'
                  }`}
                >
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="cursor-move"
                    >
                      <TaskCard task={task} compact onClick={() => handleTaskClick(task)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        task={selectedTask}
        projectId={projectId}
      />
    </div>
  );
}
