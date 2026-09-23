'use client';

import React, { useState } from 'react';
import { IconCopy, IconCheck } from './Icons';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  showText?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  className = '',
  showText = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied to clipboard!' : `${label}: ${text}`}
      aria-label={copied ? 'Copied' : `${label}: ${text}`}
      className={`btn-tactile inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
        copied
          ? 'bg-[#faf5ff] dark:bg-[#581c87]/30 text-[#6b21a8] dark:text-[#d8b4fe] border border-[#e9d5ff] dark:border-[#7e22ce]/40'
          : 'bg-[#f8f7f4] hover:bg-[#e3e1da] dark:bg-[#111215] dark:hover:bg-[#1f2229] text-[#73726c] dark:text-[#a0a2aa] hover:text-[#191817] dark:hover:text-[#f3f3f5] border border-[#e3e1da] dark:border-[#252830]'
      } ${className}`}
    >
      {copied ? <IconCheck className="w-3 h-3 text-[#6b21a8] dark:text-[#c084fc]" /> : <IconCopy className="w-3 h-3" />}
      {showText ? <span>{copied ? 'Copied!' : text}</span> : copied ? <span>Copied!</span> : null}
    </button>
  );
};
