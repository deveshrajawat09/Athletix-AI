import React from 'react';

// Empty states are invitations to act, not apologies.
// we never fill this with fake data, just a clear next step.
export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-border py-10 text-center">
      <p className="font-medium text-gray-700">{title}</p>
      {description && <p className="max-w-xs text-sm text-gray-400">{description}</p>}
      {action}
    </div>
  );
}
