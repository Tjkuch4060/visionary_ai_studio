import React from 'react';
import { LibraryItem } from './services/libraryService';
import LibraryItemCard from './LibraryItemCard';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: LibraryItem[];
  onDownload: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
}

const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, library, onDownload, onDelete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-full max-h-[80vh] rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">My Library</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close library">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow p-4 overflow-y-auto">
          {library.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Your library is empty. Save generated images and videos here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {library.map(item => (
                <LibraryItemCard key={item.id} item={item} onDownload={onDownload} onDelete={onDelete} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LibraryModal;
