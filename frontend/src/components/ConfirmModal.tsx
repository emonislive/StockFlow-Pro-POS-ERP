'use client';

import React, { useEffect } from 'react';
import { IconAlertTriangle, IconClose } from './Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-[#ffffff] dark:bg-[#17191e] border border-[#e3e1da] dark:border-[#252830] rounded-xl p-6 shadow-xl relative animate-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          aria-label="Close dialog"
          className="btn-tactile absolute right-4 top-4 text-[#73726c] hover:text-[#191817] dark:text-[#a0a2aa] dark:hover:text-[#f3f3f5] p-1 rounded-md transition-colors cursor-pointer"
        >
          <IconClose className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isDanger
                ? 'bg-[#fee2e2] dark:bg-[#7f1d1d]/30 text-[#991b1b] dark:text-[#f87171] border-[#fecaca] dark:border-[#991b1b]/50'
                : isWarning
                ? 'bg-[#ffedd5] dark:bg-[#7c2d12]/30 text-[#9a3412] dark:text-[#fb923c] border-[#fed7aa] dark:border-[#9a3412]/50'
                : 'bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#c084fc] border-[#e9d5ff] dark:border-[#7e22ce]/40'
            }`}
          >
            <IconAlertTriangle className="w-4 h-4" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#191817] dark:text-[#f3f3f5]">{title}</h3>
            <p className="mt-1 text-xs text-[#73726c] dark:text-[#a0a2aa] leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2 pt-4 border-t border-[#e3e1da] dark:border-[#252830]">
          <button
            type="button"
            onClick={onCancel}
            className="btn-tactile px-3.5 py-1.5 rounded-lg border border-[#e3e1da] dark:border-[#252830] text-xs font-medium text-[#191817] dark:text-[#f3f3f5] hover:bg-[#f8f7f4] dark:hover:bg-[#111215] transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn-tactile px-3.5 py-1.5 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer ${
              isDanger
                ? 'bg-[#c2410c] hover:bg-[#9a3412] dark:bg-[#f87171] dark:hover:bg-[#ef4444] dark:text-[#111215]'
                : isWarning
                ? 'bg-[#d97706] hover:bg-[#b45309]'
                : 'bg-[#6b21a8] hover:bg-[#581c87] dark:bg-[#7e22ce] dark:hover:bg-[#6b21a8]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
