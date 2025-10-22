import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface ShopifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (storeUrl: string) => void;
  isLoading: boolean;
  error: string | null;
}

const ShopifyConnectModal: React.FC<ShopifyConnectModalProps> = ({ isOpen, onClose, onConnect, isLoading, error }) => {
  const [storeUrl, setStoreUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(storeUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Connect to Shopify Store</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close Shopify connect">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <form onSubmit={handleSubmit}>
          <main className="p-6 space-y-4">
            <div>
              <label htmlFor="shopifyUrl" className="block text-sm font-medium text-gray-300">
                Store URL
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="shopifyUrl"
                  value={storeUrl}
                  onChange={e => setStoreUrl(e.target.value)}
                  className="block w-full rounded-md bg-gray-800 border-gray-600 shadow-sm sm:text-sm text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="your-store.myshopify.com"
                  required
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Enter your store's public `.myshopify.com` address.
              </p>
            </div>
            {error && (
                <div className="text-red-400 text-sm bg-red-900/30 border border-red-800/50 rounded-md p-3">
                    {error}
                </div>
            )}
          </main>
          <footer className="px-6 py-4 bg-gray-800/50 rounded-b-lg flex justify-end gap-3">
            <button type="button" onClick={onClose} disabled={isLoading} className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-600 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="w-28 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed">
              {isLoading ? <LoadingSpinner /> : 'Connect'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default ShopifyConnectModal;
