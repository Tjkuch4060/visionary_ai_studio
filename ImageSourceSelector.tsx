import React, { useState } from 'react';
import { ImageData } from './App';
import { GlowingEffect } from './GlowingEffect';

const fileToImageData = (file: File): Promise<ImageData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mimeTypeMatch = header.match(/:(.*?);/);
      
      if (base64 && mimeTypeMatch && mimeTypeMatch[1]) {
        resolve({ base64, mimeType: mimeTypeMatch[1], dataUrl });
      } else {
        reject(new Error("Could not parse image file."));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const FileUploader: React.FC<{ onImagesUpload: (imageData: ImageData[]) => void; className?: string }> = ({ onImagesUpload, className }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (files: FileList | null) => {
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        alert("Please upload at least one image file (e.g., PNG, JPG, WEBP).");
        return;
      }

      try {
        const imagePromises = imageFiles.map(fileToImageData);
        const imageDataArray = await Promise.all(imagePromises);
        onImagesUpload(imageDataArray);
      } catch (error) {
        console.error("Error processing files:", error);
        alert("Failed to load one or more images. Please try again.");
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  return (
    <label
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative block w-full h-full rounded-lg border-2 border-dashed p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer transition-colors flex flex-col items-center justify-center ${isDragging ? 'border-indigo-400 bg-indigo-900/10' : 'border-gray-600'} ${className}`}
    >
      <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} multiple />
      <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="mt-2 block text-sm font-semibold text-gray-400">
        Click to upload or drag & drop
      </span>
      <span className="mt-1 block text-xs text-gray-500">PNG, JPG, WEBP, GIF up to 10MB</span>
      <GlowingEffect disabled={false} proximity={20} spread={20} blur={10} />
    </label>
  );
};


const ImageSourceSelector: React.FC<{ onImagesUpload: (imageData: ImageData[]) => void; onOpenShopifyConnect: () => void; }> = ({ onImagesUpload, onOpenShopifyConnect }) => {
    return (
        <div className="w-full">
            <h2 className="text-center text-xl font-bold text-gray-300 mb-6">Choose Your Image Source</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                <FileUploader onImagesUpload={onImagesUpload} />
                <button 
                  onClick={onOpenShopifyConnect}
                  className="relative w-full h-full rounded-lg border-2 border-dashed border-gray-600 p-12 text-center hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer transition-colors flex flex-col items-center justify-center group"
                >
                    <svg className="mx-auto h-12 w-12 text-gray-500 group-hover:text-green-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.986 6.344C20.449 5.378 20.06 4.26 19.13 3.84L13.87.54C12.94.12 11.822.532 11.39 1.439L8.122 8H3a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h5.322l-.466 1.864-3.18 1.414a1.002 1.002 0 0 0-.32 1.383l1.52 3.42A1 1 0 0 0 7 21h10a1 1 0 0 0 .96-.713l3.2-12c.24-.907-.156-1.85-1.174-2.287L19.986 6.344zM8.28 12H3v-2h5.122l-1.44-5.76 4.39-1.95 2.56 5.12-2.126.944a1 1 0 0 0-.583 1.29l1.44 5.76H8.28V12zm9.68 6H8.56l-1.28-2.88 2.2-1.1.28-1.12H17a1 1 0 0 0 .96-.713l2.8-10.5 1.492.373L19.13 18z" />
                    </svg>
                    <span className="mt-2 block text-sm font-semibold text-gray-400 group-hover:text-white">
                        Import from Shopify
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">Connect your store to use product images</span>
                    <GlowingEffect disabled={false} proximity={20} spread={20} blur={10} />
                </button>
            </div>
        </div>
    );
};

export default ImageSourceSelector;
