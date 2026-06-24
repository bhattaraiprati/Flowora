'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskStatus } from '@/types/TaskInterface';
import { taskApi } from '@/lib/api';
import TaskCard from './TaskCard';
import { TaskDetailsModal } from '@/components/modal/TaskDetailsModal';

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
}

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'TODO', title: 'To Do', color: 'bg-slate-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'REVIEW', title: 'Review', color: 'bg-amber-100' },
  { id: 'DONE', title: 'Done', color: 'bg-emerald-100' },
];

export default function KanbanBoard({ tasks, projectId }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskApi.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedTask && draggedTask.status !== columnId) {
      updateTaskMutation.mutate({ taskId: draggedTask.id, status: columnId });
    }
    setDraggedTask(null);
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="h-full p-6 overflow-x-auto">
      <div className="flex gap-6 h-full min-w-max">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const isDragOver = dragOverColumn === column.id;

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-80 flex flex-col"
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color.replace('100', '500')}`} />
                  <h3 className="font-semibold text-slate-900">{column.title}</h3>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              {/* Column Content */}
              <div
                className={`flex-1 bg-slate-50 rounded-2xl p-4 space-y-3 overflow-y-auto transition-all ${
                  isDragOver ? 'ring-2 ring-brand bg-brand-light' : ''
                }`}
              >
                {columnTasks.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-8">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className="cursor-move"
                    >
                      <TaskCard task={task} onClick={() => handleTaskClick(task)} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
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
