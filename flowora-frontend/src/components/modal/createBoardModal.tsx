"use client";

import { Globe, Lock, LayoutGrid, SquarePlus, X } from "lucide-react";
import { useState } from "react";

type Visibility = "public" | "private" | "workspace";

const visibilityOptions: {
  value: Visibility;
  label: string;
  icon: React.ElementType;
  description: string;
  iconColor: string;
  iconBg: string;
  borderActive: string;
  bgActive: string;
}[] = [
  {
    value: "public",
    label: "Public",
    icon: Globe,
    description: "Anyone with the board link can view this board.",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    borderActive: "border-emerald-500",
    bgActive: "bg-emerald-50/60",
  },
  {
    value: "private",
    label: "Private",
    icon: Lock,
    description: "Only board members you invite can see this board.",
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    borderActive: "border-red-400",
    bgActive: "bg-red-50/50",
  },
  {
    value: "workspace",
    label: "Workspace",
    icon: LayoutGrid,
    description: "All members of your workspace can view and edit this board.",
    iconColor: "text-brand",
    iconBg: "bg-brand-light",
    borderActive: "border-brand",
    bgActive: "bg-brand-light/60",
  },
];

export function CreateboardModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("workspace");

  const handleClose = () => {
    setTitle("");
    setVisibility("workspace");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed w-full h-full inset-0 bg-black/30 z-40  backdrop-blur-sm flex items-center justify-center"
      onClick={handleClose}
    >
      <div
        className="bg-white mt-10 rounded-2xl z-40 w-full max-w-md mx-4 hadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 bg-brand/10 rounded-xl flex items-center justify-center">
            <SquarePlus className="w-5 h-5 text-brand" />
          </div>
          <h2 className="text-base font-semibold text-slate-800">Create New Board</h2>
          <button
            onClick={handleClose}
            className="ml-auto text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Board Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Board title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Product Roadmap, Sprint #5…"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 placeholder:text-slate-400 transition"
            />
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Visibility</label>
            <div className="space-y-2">
              {visibilityOptions.map((opt) => {
                const isSelected = visibility === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all duration-150
                      ${isSelected
                        ? `${opt.borderActive} ${opt.bgActive}`
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                  >
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg ${opt.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? "text-slate-800" : "text-slate-600"}`}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {opt.description}
                      </p>
                    </div>

                    {/* Radio dot */}
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-all
                      ${isSelected ? `${opt.borderActive} bg-white` : "border-slate-300"}`}
                    >
                      {isSelected && (
                        <div className={`w-2 h-2 rounded-full ${opt.iconBg.replace("bg-", "bg-").replace("-50", "-500").replace("brand-light", "brand")}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            disabled={!title.trim()}
            className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <SquarePlus className="w-4 h-4" />
            Create Board
          </button>
        </div>
      </div>
    </div>
  );
}