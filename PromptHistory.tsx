import React from 'react';

interface PromptHistoryProps {
  history: string[];
  onSelect: (prompt: string) => void;
  onClear: () => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({ history, onSelect, onClear }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium text-gray-400">Prompt History:</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-gray-300 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
          aria-label="Clear prompt history"
        >
          Clear
        </button>
      </div>
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2" aria-label="Recent prompts">
        {history.map((prompt, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(prompt)}
            className="px-3 py-1 text-xs rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={prompt}
          >
            {prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PromptHistory;
