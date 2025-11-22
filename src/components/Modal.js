"use client";

import React from "react";

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title || 'Dialog'}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="btn btn-ghost">Close</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
