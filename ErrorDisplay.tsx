import React from 'react';

interface ErrorDisplayProps {
  message: string | null;
  onClear: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onClear }) => {
  if (!message) {
    return null;
  }

  return (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md relative flex justify-between items-center" role="alert">
      <div>
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      <button 
        onClick={onClear} 
        className="p-1 -mr-1 rounded-full hover:bg-red-800/50 focus:outline-none focus:ring-2 focus:ring-red-400"
        aria-label="Dismiss error message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

export default ErrorDisplay;
