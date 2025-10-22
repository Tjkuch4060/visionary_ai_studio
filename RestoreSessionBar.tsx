import React from 'react';

interface RestoreSessionBarProps {
  onRestore: () => void;
  onDismiss: () => void;
}

const RestoreSessionBar: React.FC<RestoreSessionBarProps> = ({ onRestore, onDismiss }) => {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-11/12 max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-4 z-50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeInUp"
      role="alert"
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
      `}</style>
      <p className="text-sm text-gray-300 text-center sm:text-left">
        <span className="font-semibold">Welcome back!</span> You have a saved session. Would you like to restore it?
      </p>
      <div className="flex-shrink-0 flex gap-3">
        <button
          onClick={onDismiss}
          className="px-4 py-2 text-xs font-bold rounded-md bg-gray-600 hover:bg-gray-700 transition-colors"
          aria-label="Start a new session"
        >
          Start New
        </button>
        <button
          onClick={onRestore}
          className="px-4 py-2 text-xs font-bold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          aria-label="Restore previous session"
        >
          Restore Session
        </button>
      </div>
    </div>
  );
};

export default RestoreSessionBar;
