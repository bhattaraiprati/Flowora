'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, Clock, Flag, User, Tag, Trash2 } from 'lucide-react';
import { taskApi, memberApi } from '@/lib/api';
import { Task, TaskPriority, TaskStatus } from '@/types/TaskInterface';
import { ProjectMember } from '@/types/MemberInterface';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectId: string;
}

const priorityConfig: Record<TaskPriority, { color: string; label: string }> = {
  LOW: { color: 'text-slate-600 bg-slate-100', label: 'Low' },
  MEDIUM: { color: 'text-blue-600 bg-blue-100', label: 'Medium' },
  HIGH: { color: 'text-amber-600 bg-amber-100', label: 'High' },
  URGENT: { color: 'text-red-600 bg-red-100', label: 'Urgent' },
};

export function TaskDetailsModal({ isOpen, onClose, task, projectId }: TaskDetailsModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as TaskPriority,
    assigned_to: '',
    due_date: '',
    start_date: '',
    estimated_hours: '',
    tags: '',
  });
  const [error, setError] = useState('');

  const { data: members = [] } = useQuery<ProjectMember[]>({
    queryKey: ['members', 'project', projectId],
    queryFn: () => memberApi.getProjectMembers(projectId),
    enabled: isOpen && !!projectId,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        start_date: task.start_date ? task.start_date.split('T')[0] : '',
        estimated_hours: task.estimated_hours?.toString() || '',
        tags: task.tags?.join(', ') || '',
      });
    }
  }, [task]);

  const updateTaskMutation = useMutation({
    mutationFn: (data: any) => taskApi.updateTask(task!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      setIsEditing(false);
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => taskApi.deleteTask(task!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to delete task');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    const taskData: any = {
      title: formData.title.trim(),
      status: formData.status,
      priority: formData.priority,
    };

    if (formData.description.trim()) taskData.description = formData.description.trim();
    if (formData.assigned_to) taskData.assigned_to = formData.assigned_to;
    if (formData.due_date) taskData.due_date = formData.due_date;
    if (formData.start_date) taskData.start_date = formData.start_date;
    if (formData.estimated_hours) taskData.estimated_hours = parseInt(formData.estimated_hours);
    if (formData.tags.trim()) {
      taskData.tags = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
    }

    updateTaskMutation.mutate(taskData);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      deleteTaskMutation.mutate();
    }
  };

  const handleClose = () => {
    setIsEditing(false);
    setError('');
    onClose();
  };

  if (!isOpen || !task) return null;

  const priority = priorityConfig[task.priority];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">
              {isEditing ? 'Edit Task' : 'Task Details'}
            </h2>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteTaskMutation.isPending}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900 min-h-[120px] resize-none"
                placeholder="Add task description..."
              />
            </div>

            {/* Status and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="REVIEW">Review</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            {/* Assign To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assign To
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {member.user.name} ({member.user.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                />
              </div>
            </div>

            {/* Estimated Hours */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                placeholder="e.g., 4"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tags
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand text-slate-900"
                placeholder="frontend, bug, urgent (comma separated)"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateTaskMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-brand hover:bg-brand-dark text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">{task.title}</h3>
              {task.description && (
                <p className="text-slate-600 whitespace-pre-wrap">{task.description}</p>
              )}
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="p-2 bg-white rounded-lg">
                  <Flag className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="font-medium text-slate-900">{task.status.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Assigned To */}
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="p-2 bg-white rounded-lg">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assigned To</p>
                  <p className="font-medium text-slate-900">
                    {task.assignee ? task.assignee.name : 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Start Date */}
              {task.start_date && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="font-medium text-slate-900">
                      {new Date(task.start_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg">
                    <Calendar className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Due Date</p>
                    <p className="font-medium text-slate-900">
                      {new Date(task.due_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              {/* Estimated Hours */}
              {task.estimated_hours && (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg">
                    <Clock className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Estimated</p>
                    <p className="font-medium text-slate-900">{task.estimated_hours}h</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-medium text-slate-700">Tags</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Created {new Date(task.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span>
                  Updated {new Date(task.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
