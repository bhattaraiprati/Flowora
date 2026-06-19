// components/modal/CreateProjectModal.tsx
"use client";

import { SquarePlus, X, Users, Calendar, Target } from "lucide-react";
import { useState } from "react";

type ProjectStatus = "ACTIVE" | "PAUSED";

export function CreateProjectModal({
  isOpen,
  onClose,
  organizationId,
}: {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");

  const handleClose = () => {
    setName("");
    setDescription("");
    setStatus("ACTIVE");
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    try {
      // Call your API
      // await projectApi.createProject({ name, description, status, organizationId });
      console.log("Creating project:", { name, description, status, organizationId });
      handleClose();
      // Optionally refetch projects using queryClient.invalidateQueries()
    } catch (error) {
      console.error("Failed to create project", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
            <SquarePlus className="w-5 h-5 text-brand" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Create New Project</h2>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Project Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign, Q3 Marketing Campaign"
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this project..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:border-brand focus:ring-2 focus:ring-brand/10 outline-none resize-y"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Initial Status</label>
            <div className="flex gap-3">
              {(["ACTIVE", "PAUSED"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all
                    ${status === s
                      ? s === "ACTIVE"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-slate-200 hover:border-slate-300"
                    }`}
                >
                  {s === "ACTIVE" ? "Active" : "Paused"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex-1 py-3 bg-brand text-white rounded-xl font-semibold hover:bg-brand-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <SquarePlus className="w-4 h-4" />
            Create Project
          </button>
        </div>
      </div>
    </div>
  );
}