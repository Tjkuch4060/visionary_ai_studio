import React, { useState, useCallback, useEffect, useRef } from 'react';
import { editImageWithGemini, animateImageWithGemini } from './services/geminiService';
import ImageSlider from './ImageSlider';
import ErrorDisplay from './ErrorDisplay';
import RichTextEditor, { KEYWORDS } from './RichTextEditor';
import PromptHistory from './PromptHistory';
import PromptSuggestions from './PromptSuggestions';
import MaskingCanvas from './MaskingCanvas';

interface ImageData {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

type Mode = 'edit' | 'animate';
type AspectRatio = '16:9' | '9:16';

const VIDEO_LOADING_MESSAGES = [
    "Our AI is warming up the cameras... 🎬",
    "Storyboarding your scene... 📝",
    "Rendering frame by frame... ✨",
    "Adding the final cinematic touches... 🍿"
];

const HISTORY_KEY = 'promptHistory';
const MAX_HISTORY_LENGTH = 10;

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

const ImageUploader: React.FC<{ onImagesUpload: (imageData: ImageData[]) => void; className?: string }> = ({ onImagesUpload, className }) => {
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
      className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 cursor-pointer transition-colors ${isDragging ? 'border-indigo-400 bg-indigo-900/10' : 'border-gray-600'} ${className}`}
    >
      <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} multiple />
      <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="mt-2 block text-sm font-semibold text-gray-400">
        Click to upload or drag and drop image(s)
      </span>
      <span className="mt-1 block text-xs text-gray-500">PNG, JPG, WEBP, GIF up to 10MB</span>
    </label>
  );
};

const MediaDisplay: React.FC<{ src?: string | null; title?: string; isLoading?: boolean; mediaType?: 'image' | 'video', loadingMessage?: string, onDownload?: () => void }> = ({ src, title, isLoading, mediaType = 'image', loadingMessage, onDownload }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>}
    <div className="aspect-square w-full rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden relative group">
      {isLoading && <LoadingSpinner message={loadingMessage} />}
      {!isLoading && src && mediaType === 'image' && <img src={src} alt={title || 'media'} className="w-full h-full object-contain" />}
      {!isLoading && src && mediaType === 'video' && <video src={src} controls autoPlay loop className="w-full h-full object-contain" />}
      {!isLoading && !src && <div className="text-gray-500 text-sm">{mediaType === 'image' ? 'Image' : 'Video'} will appear here</div>}
      
      {!isLoading && src && onDownload && mediaType === 'image' && (
        <button
          onClick={onDownload}
          className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          aria-label="Download image"
          title="Download image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      )}
    </div>
  </div>
);

const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center">
        <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {message && <p className="mt-4 text-sm text-gray-400">{message}</p>}
    </div>
);

const HistoryControls: React.FC<{
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}> = ({ onUndo, onRedo, canUndo, canRedo }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={onUndo}
      disabled={!canUndo}
      className="p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Undo (Ctrl+Z)"
      aria-label="Undo last edit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 015 5v1" />
      </svg>
    </button>
    <button
      onClick={onRedo}
      disabled={!canRedo}
      className="p-2 rounded-md bg-gray-700/50 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      title="Redo (Ctrl+Y)"
      aria-label="Redo last edit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 00-5 5v1" />
      </svg>
    </button>
  </div>
);


const App: React.FC = () => {
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [editHistory, setEditHistory] = useState<{
    past: string[][];
    present: string[];
    future: string[][];
  }>({ past: [], present: [], future: [] });
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('edit');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [imageAspectRatio, setImageAspectRatio] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [isMasking, setIsMasking] = useState<boolean>(false);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const loadingIntervalRef = useRef<number | null>(null);
  
  const editedImages = editHistory.present;

  useEffect(() => {
    if (mode === 'animate') {
      // @ts-ignore
      window.aistudio?.hasSelectedApiKey().then((hasKey: boolean) => {
        setIsKeySelected(hasKey);
      });
    }
  }, [mode]);

  useEffect(() => {
    try {
        const storedHistory = localStorage.getItem(HISTORY_KEY);
        if (storedHistory) {
            setPromptHistory(JSON.parse(storedHistory));
        }
    } catch (error) {
        console.error("Failed to parse prompt history from localStorage", error);
        localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      if (mode === 'animate') {
        let i = 0;
        setLoadingMessage(VIDEO_LOADING_MESSAGES[0]);
        loadingIntervalRef.current = window.setInterval(() => {
          i = (i + 1) % VIDEO_LOADING_MESSAGES.length;
          setLoadingMessage(VIDEO_LOADING_MESSAGES[i]);
        }, 3000);
      } else if (mode === 'edit') {
        setLoadingMessage("Applying your creative edits...");
      }
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
      setLoadingMessage('');
    }

    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    };
  }, [isLoading, mode]);

  const handleImagesUpload = useCallback((imageData: ImageData[]) => {
    setOriginalImages(imageData);
    setEditHistory({ past: [], present: [], future: [] });
    setGeneratedVideo(null);
    setError(null);
    setPrompt('');
    setIsMasking(false);
    setMaskDataUrl(null);
    setImageAspectRatio(null);
    if (imageData.length > 1 && mode === 'animate') {
      setMode('edit');
    }
  }, [mode]);
  
  const handleSelectKey = async () => {
      // @ts-ignore
      await window.aistudio?.openSelectKey();
      // Assume success and update UI immediately
      setIsKeySelected(true);
  };

  const updatePromptHistory = (newPrompt: string) => {
    setPromptHistory(prevHistory => {
        const updatedHistory = [newPrompt, ...prevHistory.filter(p => p !== newPrompt)];
        const slicedHistory = updatedHistory.slice(0, MAX_HISTORY_LENGTH);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(slicedHistory));
        } catch (error) {
            console.error("Failed to save prompt history to localStorage", error);
        }
        return slicedHistory;
    });
  };

  const handleClearHistory = () => {
      setPromptHistory([]);
      localStorage.removeItem(HISTORY_KEY);
  };

  const handleUndo = useCallback(() => {
    setEditHistory(current => {
      if (current.past.length === 0) return current;
      const newPast = current.past.slice(0, current.past.length - 1);
      const previous = current.past[current.past.length - 1];
      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setEditHistory(current => {
      if (current.future.length === 0) return current;
      const newFuture = current.future.slice(1);
      const next = current.future[0];
      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const handleMaskSave = (newMaskDataUrl: string) => {
    setMaskDataUrl(newMaskDataUrl);
    setIsMasking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (originalImages.length === 0 || !trimmedPrompt) {
      setError(`Please upload at least one image and enter a${mode === 'edit' ? 'n editing' : 'n animation'} prompt.`);
      return;
    }

    if (mode === 'animate') {
        if (!isKeySelected) {
            setError("Please select an API key to generate videos.");
            return;
        }
        if (originalImages.length > 1) {
            setError("Video animation only supports one image at a time.");
            return;
        }
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    updatePromptHistory(trimmedPrompt);
    
    const finalPrompt = (mode === 'edit' && imageAspectRatio)
        ? `${trimmedPrompt}. Ensure the final image has a ${imageAspectRatio} aspect ratio.`
        : trimmedPrompt;

    try {
        if (mode === 'edit') {
            const results = await Promise.allSettled(
                originalImages.map(image => 
                    editImageWithGemini(image.base64, image.mimeType, finalPrompt, maskDataUrl ?? undefined)
                )
            );
            
            const successfulEdits = results
                .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
                .map(r => r.value);
            
            const failedReasons = results
                .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
                .map(r => r.reason instanceof Error ? r.reason.message : String(r.reason));
            
            if (successfulEdits.length > 0) {
                setEditHistory(h => {
                    const newPast = h.present.length > 0 ? [...h.past, h.present] : h.past;
                    return {
                        past: newPast,
                        present: successfulEdits,
                        future: [],
                    };
                });
            }
            if (failedReasons.length > 0) {
                setError(`Failed to process ${failedReasons.length} image(s). Please try again. Errors: ${failedReasons.join(', ')}`);
            }

        } else { // Animate mode
            const videoUrl = await animateImageWithGemini(originalImages[0].base64, originalImages[0].mimeType, trimmedPrompt, aspectRatio);
            setGeneratedVideo(videoUrl);
        }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      if (errorMessage.includes("Requested entity was not found")) {
          setError("API Key validation failed. Please select a valid API key and try again.");
          setIsKeySelected(false);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setPrompt('');
    setError(null);
    setAspectRatio('16:9');
    setImageAspectRatio(null);
  };

  const handleDownload = (dataUrl: string, index: number) => {
    const link = document.createElement('a');
    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';'));
    const extension = mimeType.split('/')[1] || 'png';
    link.href = dataUrl;
    link.download = `edited-image-${index + 1}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setPrompt(prev => {
        const newPrompt = prev.trim() ? `${prev.trim()} ${suggestion}` : suggestion;
        return newPrompt;
    });
  };
  
  const renderResults = () => {
    if (originalImages.length === 0) return null;

    // Single image slider view
    if (mode === 'edit' && originalImages.length === 1 && editedImages.length === 1 && !isLoading && !isMasking) {
        return <ImageSlider beforeSrc={originalImages[0].dataUrl} afterSrc={editedImages[0]} />;
    }

    // Batch edit grid view
    if (mode === 'edit' && originalImages.length > 1 && editedImages.length > 0 && !isLoading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-300 text-center">Batch Edit Results</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {originalImages.map((img, index) => (
                        <div key={index} className="space-y-2">
                             <MediaDisplay src={img.dataUrl} title="Original" mediaType='image' />
                             <MediaDisplay 
                                src={editedImages[index]} 
                                title="Edited" 
                                mediaType='image' 
                                onDownload={() => handleDownload(editedImages[index], index)}
                             />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default two-column layout for single image or loading state
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">Original Image(s)</h3>
                
                {isMasking && originalImages.length === 1 ? (
                    <MaskingCanvas 
                        imageSrc={originalImages[0].dataUrl}
                        onSave={handleMaskSave}
                        onCancel={() => setIsMasking(false)}
                    />
                ) : (
                    <div className={`grid gap-4 ${originalImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {originalImages.map((img, index) => (
                            <div key={index} className="relative group">
                                <MediaDisplay src={img.dataUrl} mediaType='image' />
                                {maskDataUrl && originalImages.length === 1 && (
                                    <img src={maskDataUrl} alt="Applied mask" className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-50" />
                                )}
                                {mode === 'edit' && originalImages.length === 1 && (
                                    <div className="absolute top-2 right-2 flex flex-col gap-2 items-end opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setIsMasking(true)}
                                            className="bg-indigo-600 text-white px-3 py-2 text-sm rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                                        >
                                            {maskDataUrl ? 'Edit Mask' : 'Add Mask'}
                                        </button>
                                        {maskDataUrl && (
                                            <button onClick={() => setMaskDataUrl(null)} className="bg-red-600 text-white px-3 py-1 text-xs rounded-md shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500">
                                                Remove Mask
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium text-gray-300">
                        {mode === 'edit' ? 'Edited Image(s)' : 'Generated Video'}
                    </h3>
                    {mode === 'edit' && (
                        <HistoryControls
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={editHistory.past.length > 0}
                            canRedo={editHistory.future.length > 0}
                        />
                    )}
                </div>
                <div className="flex items-center justify-center h-full">
                    {isLoading ? (
                       <div className="w-full aspect-square"><MediaDisplay isLoading={true} mediaType={mode === 'edit' ? 'image' : 'video'} loadingMessage={loadingMessage}/></div>
                    ) : (
                        <>
                            {mode === 'edit' && (
                                <div className={`grid gap-4 ${editedImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* This part is now handled by the batch view, but kept for single edits */}
                                    {editedImages.length === 1 && <MediaDisplay src={editedImages[0]} mediaType='image' onDownload={() => handleDownload(editedImages[0], 0)} />}
                                </div>
                            )}
                            {mode === 'animate' && generatedVideo && (
                                <MediaDisplay src={generatedVideo} mediaType='video' />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Visionary AI Studio
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Edit images or create short video ads with simple text prompts.
          </p>
        </header>
        
        <main className="space-y-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
            {originalImages.length === 0 ? (
                <ImageUploader onImagesUpload={handleImagesUpload} />
            ) : (
                <>
                    <div className="mb-6 border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => handleModeChange('edit')} className={`${mode === 'edit' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                                Edit Image(s)
                            </button>
                            <button 
                                onClick={() => handleModeChange('animate')} 
                                disabled={originalImages.length > 1}
                                title={originalImages.length > 1 ? "Animation is only available for a single image" : ""}
                                className={`${mode === 'animate' ? 'border-indigo-400 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
                                Animate Video
                            </button>
                        </nav>
                    </div>
                     {mode === 'animate' && !isKeySelected && (
                        <div className="mb-4 bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-md flex flex-col sm:flex-row justify-between items-center">
                            <div>
                                <p><strong className="font-bold">API Key Required: </strong> The video animation feature requires a Google Cloud project API key.</p>
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-sm text-yellow-200 underline hover:text-yellow-100">Learn about billing.</a>
                            </div>
                            <button onClick={handleSelectKey} className="mt-2 sm:mt-0 sm:ml-4 flex-shrink-0 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700">Select API Key</button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                               {mode === 'edit' ? 'Editing' : 'Animation'} Prompt {mode === 'edit' && originalImages.length > 1 ? '(applied to all images)' : ''}
                               {maskDataUrl && <span className="text-xs text-indigo-400 ml-2">(Mask Applied)</span>}
                            </label>
                            <RichTextEditor
                                value={prompt}
                                onChange={setPrompt}
                                placeholder={mode === 'edit' ? 'e.g., "Add a retro filter"' : 'e.g., "Slowly zoom in with shimmering particles"'}
                                rows={3}
                            />
                        </div>

                        {mode === 'edit' && (
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Aspect Ratio (optional)
                                </label>
                                <div className="flex flex-wrap gap-2 rounded-md bg-gray-900 p-1">
                                    {['Default', '1:1', '4:3', '3:2', '16:9', '9:16'].map((ratio) => {
                                        const isDefault = ratio === 'Default';
                                        const value = isDefault ? null : ratio;
                                        return (
                                            <button
                                                key={ratio}
                                                type="button"
                                                onClick={() => setImageAspectRatio(value)}
                                                className={`flex-grow rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-colors ${
                                                    imageAspectRatio === value
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-gray-300 hover:bg-gray-700'
                                                }`}
                                            >
                                                {ratio}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {mode === 'animate' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Video Aspect Ratio
                                </label>
                                <div className="flex space-x-2 rounded-md bg-gray-900 p-1">
                                    {(['16:9', '9:16'] as const).map((ratio) => (
                                        <button
                                            key={ratio}
                                            type="button"
                                            onClick={() => setAspectRatio(ratio)}
                                            className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                                aspectRatio === ratio
                                                    ? 'bg-indigo-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                            }`}
                                        >
                                            {ratio} ({ratio === '16:9' ? 'Landscape' : 'Portrait'})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            <PromptSuggestions
                                mode={mode}
                                keywords={KEYWORDS}
                                onSelect={handleSuggestionSelect}
                            />
                            <PromptHistory
                                history={promptHistory}
                                onSelect={setPrompt}
                                onClear={handleClearHistory}
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="submit"
                                disabled={isLoading || (mode === 'animate' && !isKeySelected)}
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:bg-indigo-900/50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <><LoadingSpinner /> <span className="ml-2">Generating...</span></> : (mode === 'edit' ? `Generate ${originalImages.length} Image(s)` : 'Generate Video')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setOriginalImages([])}
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-600 bg-gray-700 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                Change Image(s)
                            </button>
                        </div>
                    </form>
                </>
            )}
          </div>
          
          <ErrorDisplay message={error} onClear={() => setError(null)} />

          {renderResults()}
        </main>
      </div>
    </div>
  );
};

export default App;