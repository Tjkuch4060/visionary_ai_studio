import React from 'react';

interface PromptSuggestionsProps {
  mode: 'edit' | 'animate';
  keywords: {
      actions: string[];
      animations: string[];
      styles: string[];
      subjects: string[];
      quality: string[];
  };
  onSelect: (suggestion: string) => void;
}

const SuggestionCategory: React.FC<{ title: string; items: string[]; onSelect: (item: string) => void }> = ({ title, items, onSelect }) => (
    <div>
        <p className="text-xs font-medium text-gray-400 mb-1.5">{title} Suggestions:</p>
        <div className="flex flex-wrap gap-2">
            {items.map(item => (
                <button
                    key={item}
                    type="button"
                    onClick={() => onSelect(item)}
                    className="px-3 py-1 text-xs rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                    aria-label={`Add '${item}' to prompt`}
                >
                    {item}
                </button>
            ))}
        </div>
    </div>
);

const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({ mode, keywords, onSelect }) => {
  return (
    <div className="space-y-3">
      {mode === 'edit' && <SuggestionCategory title="Action" items={keywords.actions} onSelect={onSelect} />}
      {mode === 'animate' && <SuggestionCategory title="Animation" items={keywords.animations} onSelect={onSelect} />}
      <SuggestionCategory title="Style" items={keywords.styles} onSelect={onSelect} />
      <SuggestionCategory title="Subject" items={keywords.subjects} onSelect={onSelect} />
      <SuggestionCategory title="Quality Booster" items={keywords.quality} onSelect={onSelect} />
    </div>
  );
};

export default PromptSuggestions;