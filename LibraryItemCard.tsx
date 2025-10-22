import React from 'react';
import { LibraryItem } from './services/libraryService';

interface LibraryItemCardProps {
  item: LibraryItem;
  onDownload: (item: LibraryItem) => void;
  onDelete: (id: string) => void;
}

const LibraryItemCard: React.FC<LibraryItemCardProps> = ({ item, onDownload, onDelete }) => {
  const mediaElement = item.type === 'image'
    ? <img src={item.dataUrl} alt={item.prompt} className="w-full h-full object-cover" />
    : <video src={item.dataUrl} loop muted className="w-full h-full object-cover" onMouseEnter={e => e.currentTarget.play()} onMouseLeave={e => e.currentTarget.pause()} />;

  return (
    <div className="aspect-square w-full rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden relative group">
      {mediaElement}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
        <p className="text-xs line-clamp-3" title={item.prompt}>{item.prompt}</p>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onDownload(item)}
            className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Download"
            title="Download"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Delete from library"
            title="Delete from library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LibraryItemCard;
