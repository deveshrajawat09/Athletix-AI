import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export default function SelectField({ value, onChange, options, className = '', 'aria-label': ariaLabel }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  function choose(option) {
    onChange({ target: { value: option.value } });
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="input-field flex items-center justify-between gap-3 text-left"
      >
        <span className="truncate">{selected?.label || 'Select an option'}</span>
        <ChevronDown size={16} className={`shrink-0 text-[#82958d] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={ariaLabel} className="absolute left-0 top-[calc(100%+0.4rem)] z-30 max-h-64 w-full overflow-y-auto rounded-xl border border-[#dce8df] bg-white p-1.5 shadow-[0_14px_30px_rgba(37,78,65,0.14)]">
          {options.map((option) => {
            const isSelected = String(option.value) === String(value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${isSelected ? 'bg-[#e3f2e6] font-semibold text-[#287861]' : 'text-[#46635a] hover:bg-[#f4faf5]'}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={15} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
