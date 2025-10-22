import React from 'react';
import { PromptTemplateCategory } from './services/templateService';

interface PromptTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  templates: PromptTemplateCategory[];
  currentMode: 'edit' | 'animate';
}

const highlightPlaceholders = (text: string): React.ReactNode => {
    const parts = text.split(/(\[[a-zA-Z]+\])/g);
    return parts.map((part, index) => 
        part.match(/(\[[a-zA-Z]+\])/)
            ? <span key={index} className="text-amber-400 font-medium">{part}</span>
            : part
    );
};

const PromptTemplatesModal: React.FC<PromptTemplatesModalProps> = ({ isOpen, onClose, onSelect, templates, currentMode }) => {
  if (!isOpen) return null;

  const filteredTemplates = templates
    .map(category => ({
      ...category,
      templates: category.templates.filter(template => template.modes.includes(currentMode)),
    }))
    .filter(category => category.templates.length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-full max-h-[80vh] rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Prompt Templates</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close prompt templates">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No templates available for the current mode.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredTemplates.map(category => (
                <section key={category.category}>
                  <h3 className="text-lg font-semibold text-indigo-400 mb-4">{category.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.templates.map(template => (
                      <div key={template.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col justify-between">
                        <div>
                            <h4 className="font-bold text-gray-200">{template.title}</h4>
                            <p className="text-xs text-gray-400 mt-1 mb-3">{template.description}</p>
                            <p className="text-sm text-gray-300 bg-gray-900/70 p-3 rounded-md font-mono leading-relaxed">
                                {highlightPlaceholders(template.prompt)}
                            </p>
                        </div>
                        <button
                          onClick={() => onSelect(template.prompt)}
                          className="w-full mt-4 text-center rounded-md bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                        >
                          Use Template
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PromptTemplatesModal;
