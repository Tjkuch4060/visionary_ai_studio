import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { ShopifyProduct, ShopifyProductImage } from './services/shopifyService';

interface ShopifyProductPickerProps {
  isOpen: boolean;
  onClose: () => void;
  products: ShopifyProduct[];
  onImport: (selectedImages: ShopifyProductImage[]) => void;
  isLoading: boolean;
  error: string | null;
  storeUrl: string;
}

const ShopifyProductPicker: React.FC<ShopifyProductPickerProps> = ({ isOpen, onClose, products, onImport, isLoading, error, storeUrl }) => {
  const [selectedImages, setSelectedImages] = useState<ShopifyProductImage[]>([]);

  const handleToggleImage = (image: ShopifyProductImage) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(img => img.id === image.id);
      if (isSelected) {
        return prev.filter(img => img.id !== image.id);
      } else {
        return [...prev, image];
      }
    });
  };

  const handleImport = () => {
    if (selectedImages.length > 0) {
      onImport(selectedImages);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-full max-h-[80vh] rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Select Product Images</h2>
            <p className="text-sm text-gray-400">Store: {storeUrl}</p>
          </div>
          <button onClick={onClose} disabled={isLoading} className="p-1 rounded-full text-gray-400 hover:bg-gray-700 disabled:opacity-50" aria-label="Close product picker">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="flex-grow p-4 overflow-y-auto">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/30 border border-red-800/50 rounded-md p-3 mb-4">
                {error}
            </div>
          )}
          <div className="space-y-6">
            {products.map(product => (
              <div key={product.id}>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">{product.title}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {product.images.map(image => {
                    const isSelected = selectedImages.some(img => img.id === image.id);
                    return (
                      <button
                        key={image.id}
                        onClick={() => handleToggleImage(image)}
                        className={`relative aspect-square w-full rounded-md overflow-hidden focus:outline-none ring-2 ring-offset-2 ring-offset-gray-900 transition-all ${isSelected ? 'ring-indigo-500' : 'ring-transparent hover:ring-indigo-600/50'}`}
                      >
                        <img src={image.src} alt={product.title} className="w-full h-full object-cover" />
                        {isSelected && (
                          <div className="absolute inset-0 bg-indigo-600/70 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </main>
        <footer className="px-6 py-4 bg-gray-800/50 rounded-b-lg flex justify-between items-center">
          <p className="text-sm text-gray-400">{selectedImages.length} image(s) selected</p>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600 disabled:opacity-50">
              Cancel
            </button>
            <button 
                type="button" 
                onClick={handleImport} 
                disabled={isLoading || selectedImages.length === 0} 
                className="w-48 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed"
            >
              {isLoading ? <LoadingSpinner /> : `Import ${selectedImages.length} Image(s)`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ShopifyProductPicker;
