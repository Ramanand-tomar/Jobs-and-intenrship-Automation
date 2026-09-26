"use client"

import React from "react"

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-neutral-100">{title}</h3>
          <p className="text-xs text-neutral-400 leading-relaxed">{description}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isDestructive
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-primary hover:bg-primary/90 text-black"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
