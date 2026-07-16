import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
