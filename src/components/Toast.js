"use client";

import { useEffect, useState } from 'react';

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const detail = e && e.detail ? e.detail : { message: String(e) };
      setToast({ message: detail.message || 'Done', type: detail.type || 'success' });
      // auto-dismiss
      setTimeout(() => setToast(null), detail.duration || 3000);
    };
    window.addEventListener('toast', handler);
    return () => window.removeEventListener('toast', handler);
  }, []);

  if (!toast) return null;

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warn: 'bg-yellow-600',
  };

  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className={`text-white px-4 py-2 rounded shadow ${colors[toast.type] || colors.info}`}>
        {toast.message}
      </div>
    </div>
  );
}
