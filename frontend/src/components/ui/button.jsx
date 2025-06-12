import React from 'react';

export function Button({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${className}`}
    >
      {children}
    </button>
  );
}
