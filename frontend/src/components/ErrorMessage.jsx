import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorMessage({ message = 'Something went wrong.' }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
}
