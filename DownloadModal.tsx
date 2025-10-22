import React, { useState, useEffect } from 'react';

type ImageFormat = 'png' | 'jpeg';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: { fileName: string; format: ImageFormat }) => void;
  imageDataUrl: string | null;
  defaultFileName: string;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, onConfirm, imageDataUrl, defaultFileName }) => {
  const [fileName, setFileName] = useState(defaultFileName);
  const [format, setFormat] = useState<ImageFormat>('png');

  useEffect(() => {
    if (isOpen) {
      setFileName(defaultFileName);
      setFormat('png'); // Reset to default
    }
  }, [isOpen, defaultFileName]);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ fileName, format });
  };

  if (!isOpen || !imageDataUrl) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Download Image</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close download options">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <form onSubmit={handleConfirm}>
          <main className="p-6 space-y-6">
            <div className="w-full aspect-video rounded-md bg-gray-800 flex items-center justify-center overflow-hidden">
                <img src={imageDataUrl} alt="Download preview" className="max-w-full max-h-full object-contain" />
            </div>
            <div className="space-y-2">
                <label htmlFor="fileName" className="block text-sm font-medium text-gray-300">File name</label>
                <input
                    type="text"
                    id="fileName"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    className="block w-full rounded-md bg-gray-800 border-gray-600 shadow-sm sm:text-sm text-white focus:border-indigo-500 focus:ring-indigo-500"
                    required
                />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Format</label>
                <div className="flex space-x-2 rounded-md bg-gray-800 p-1">
                    {(['png', 'jpeg'] as const).map((f) => (
                        <button
                            key={f}
                            type="button"
                            onClick={() => setFormat(f)}
                            className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                format === f
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
          </main>
          <footer className="px-6 py-4 bg-gray-800/50 rounded-b-lg flex justify-end gap-3">
              <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600">
                  Cancel
              </button>
              <button type="submit" className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">
                  Download
              </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default DownloadModal;
