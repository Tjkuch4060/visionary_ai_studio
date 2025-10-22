import React, { useState, useCallback, useEffect, useRef } from 'react';
import { editImageWithGemini, animateImageWithGemini } from './services/geminiService';
import { getLibrary, saveLibrary, LibraryItem } from './services/libraryService';
import { fetchShopifyProducts, convertImageUrlsToImageData, ShopifyProductImage } from './services/shopifyService';
import ImageSlider from './ImageSlider';
import ErrorDisplay from './ErrorDisplay';
import RichTextEditor, { KEYWORDS } from './RichTextEditor';
import PromptHistory from './PromptHistory';
import PromptSuggestions from './PromptSuggestions';
import MaskingCanvas from './MaskingCanvas';
import UserProfile from './UserProfile';
import LibraryModal from './LibraryModal';
import DownloadModal from './DownloadModal';
import Login from './Login';
import ImageSourceSelector from './ImageSourceSelector';
import ShopifyConnectModal from './ShopifyConnectModal';
import ShopifyProductPicker from './ShopifyProductPicker';
import LoadingSpinner from './LoadingSpinner';
import RestoreSessionBar from './RestoreSessionBar';
import PromptTemplatesModal from './PromptTemplatesModal';
import { PROMPT_TEMPLATES } from './services/templateService';


export interface ImageData {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

interface VideoData {
  objectUrl: string | null;
  blob: Blob | null;
}

type Mode = 'edit' | 'animate';
type AspectRatio = '16:9' | '9:16';
type ShopifyProduct = { id: number, title: string, images: {id: number, src: string}[] };


const VIDEO_LOADING_MESSAGES = [
    "Our AI is warming up the cameras... 🎬",
    "Storyboarding your scene... 📝",
    "Rendering frame by frame... ✨",
    "Adding the final cinematic touches... 🍿"
];

const HISTORY_KEY = 'promptHistory';
const AUTOSAVE_KEY = 'visionaryStudioAutoSave';
const MAX_HISTORY_LENGTH = 10;

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.error) {
        reject(reader.error);
      } else {
        resolve(reader.result as string);
      }
    };
    reader.readAsDataURL(blob);
  });
};

const dataURLtoBlob = (dataUrl: string): Promise<Blob> => {
    return fetch(dataUrl).then(res => res.blob());
};


const MediaDisplay: React.FC<{ src?: string | null; title?: string; isLoading?: boolean; mediaType?: 'image' | 'video', loadingMessage?: string, onDownload?: () => void; onSave?: () => void }> = ({ src, title, isLoading, mediaType = 'image', loadingMessage, onDownload, onSave }) => (
  <div className="w-full">
    {title && <h3 className="text-lg font-medium text-gray-300 mb-2">{title}</h3>}
    <div className="aspect-square w-full rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center overflow-hidden relative group">
      {isLoading && <LoadingSpinner message={loadingMessage} />}
      {!isLoading && src && mediaType === 'image' && <img src={src} alt={title || 'media'} className="w-full h-full object-contain" />}
      {!isLoading && src && mediaType === 'video' && <video src={src} controls autoPlay loop className="w-full h-full object-contain" />}
      {!isLoading && !src && <div className="text-gray-500 text-sm">{mediaType === 'image' ? 'Image' : 'Video'} will appear here</div>}
      
      {!isLoading && src && (onDownload || onSave) && (
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onSave && (
            <button
              onClick={onSave}
              className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label="Save to library"
              title="Save to library"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              aria-label={`Download ${mediaType}`}
              title={`Download ${mediaType}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
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

const convertImageFormat = (dataUrl: string, format: 'png' | 'jpeg', quality: number = 0.92): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }
        ctx.drawImage(image, 0, 0);
        const newMimeType = `image/${format}`;
        const newDataUrl = canvas.toDataURL(newMimeType, format === 'jpeg' ? quality : undefined);
        resolve(newDataUrl);
      };
      image.onerror = (err) => reject(err);
      image.src = dataUrl;
    });
  };

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [originalImages, setOriginalImages] = useState<ImageData[]>([]);
  const [editHistory, setEditHistory] = useState<{
    past: string[][];
    present: string[];
    future: string[][];
  }>({ past: [], present: [], future: [] });
  const [generatedVideo, setGeneratedVideo] = useState<VideoData>({ objectUrl: null, blob: null });
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
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [downloadModalState, setDownloadModalState] = useState<{
    isOpen: boolean;
    dataUrl: string | null;
    defaultFileName: string;
  }>({ isOpen: false, dataUrl: null, defaultFileName: '' });
  const [savedSession, setSavedSession] = useState<any | null>(null);

  // Shopify State
  const [isShopifyConnectOpen, setIsShopifyConnectOpen] = useState(false);
  const [isShopifyPickerOpen, setIsShopifyPickerOpen] = useState(false);
  const [shopifyStoreUrl, setShopifyStoreUrl] = useState('');
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [shopifyError, setShopifyError] = useState<string|null>(null);

  const loadingIntervalRef = useRef<number | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);
  
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
        setLibrary(getLibrary());
        const savedData = localStorage.getItem(AUTOSAVE_KEY);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (parsedData.originalImages && parsedData.originalImages.length > 0) {
                setSavedSession(parsedData);
            }
        }
    } catch (error) {
        console.error("Failed to parse from localStorage", error);
        localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, []);

  useEffect(() => {
    // Don't save if there's nothing to save or if we're showing the restore prompt
    if (originalImages.length === 0 || savedSession) {
        return;
    }

    if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = window.setTimeout(async () => {
        try {
            const videoDataUrl = generatedVideo.blob ? await blobToDataURL(generatedVideo.blob) : null;
            const sessionToSave = {
                originalImages,
                editHistory,
                generatedVideoDataUrl: videoDataUrl,
                prompt,
                mode,
                aspectRatio,
                imageAspectRatio,
                maskDataUrl,
            };
            localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(sessionToSave));
        } catch (error) {
            console.error("Failed to auto-save session:", error);
        }
    }, 1000); // Debounce for 1 second

    return () => {
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }
    };
  }, [originalImages, editHistory, generatedVideo, prompt, mode, aspectRatio, imageAspectRatio, maskDataUrl, savedSession]);

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

  const clearAutoSave = () => {
    localStorage.removeItem(AUTOSAVE_KEY);
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
  };

  const handleImagesUpload = useCallback((imageData: ImageData[]) => {
    setOriginalImages(imageData);
    setEditHistory({ past: [], present: [], future: [] });
    setGeneratedVideo({ objectUrl: null, blob: null });
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

  const handleSaveToLibrary = (type: 'image' | 'video', dataUrl: string, currentPrompt: string, originalImage?: string) => {
    const newItem: LibraryItem = {
      id: Date.now().toString(),
      type,
      dataUrl,
      prompt: currentPrompt,
      createdAt: new Date().toISOString(),
      originalImage,
    };
    const newLibrary = [newItem, ...library];
    setLibrary(newLibrary);
    saveLibrary(newLibrary);
  };

  const handleRemoveFromLibrary = (id: string) => {
    const newLibrary = library.filter(item => item.id !== id);
    setLibrary(newLibrary);
    saveLibrary(newLibrary);
  };

  const handleLibraryDownload = (item: LibraryItem) => {
    if (item.type === 'video') {
      const link = document.createElement('a');
      link.href = item.dataUrl;
      link.download = `visionary-studio-${item.id}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    setDownloadModalState({
        isOpen: true,
        dataUrl: item.dataUrl,
        defaultFileName: `visionary-studio-${item.id}`
    });
  };
  
  const handleConnectToShopify = async (storeUrl: string) => {
    setShopifyError(null);
    setShopifyLoading(true);
    try {
        const products = await fetchShopifyProducts(storeUrl);
        setShopifyProducts(products);
        setShopifyStoreUrl(storeUrl);
        setIsShopifyConnectOpen(false);
        setIsShopifyPickerOpen(true);
    } catch (err) {
        setShopifyError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setShopifyLoading(false);
    }
  };
  
  const handleShopifyImport = async (selectedImages: ShopifyProductImage[]) => {
      setShopifyError(null);
      setShopifyLoading(true);
      try {
          const imageDataArray = await convertImageUrlsToImageData(selectedImages);
          handleImagesUpload(imageDataArray);
          setIsShopifyPickerOpen(false);
      } catch (err) {
          setShopifyError(err instanceof Error ? err.message : "Failed to import images.");
      } finally {
          setShopifyLoading(false);
      }
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
    setGeneratedVideo({ objectUrl: null, blob: null });
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
            const { objectUrl, blob } = await animateImageWithGemini(originalImages[0].base64, originalImages[0].mimeType, trimmedPrompt, aspectRatio);
            setGeneratedVideo({ objectUrl, blob });
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
    setDownloadModalState({
        isOpen: true,
        dataUrl,
        defaultFileName: `edited-image-${index + 1}`
    });
  };

  const handleVideoDownload = (videoUrl: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = 'generated-video.mp4';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleSaveVideo = async () => {
    if (generatedVideo.blob) {
      const dataUrl = await blobToDataURL(generatedVideo.blob);
      handleSaveToLibrary('video', dataUrl, prompt, originalImages[0].dataUrl);
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    setPrompt(prev => {
        const newPrompt = prev.trim() ? `${prev.trim()} ${suggestion}` : suggestion;
        return newPrompt;
    });
  };
  
  const handleConfirmDownload = async ({ fileName, format }: { fileName: string, format: 'png' | 'jpeg' }) => {
    if (!downloadModalState.dataUrl) return;

    try {
        const finalDataUrl = await convertImageFormat(downloadModalState.dataUrl, format);

        const link = document.createElement('a');
        link.href = finalDataUrl;
        link.download = `${fileName.trim() || 'download'}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadModalState({ isOpen: false, dataUrl: null, defaultFileName: '' });
    } catch (error) {
        console.error("Failed to convert or download image:", error);
        setError("Failed to process image for download. Please try again.");
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    clearAutoSave();
    // Optional: clear state on logout
    setOriginalImages([]);
    setEditHistory({ past: [], present: [], future: [] });
    setGeneratedVideo({ objectUrl: null, blob: null });
  };

  const handleRestoreSession = async () => {
    if (!savedSession) return;
    setOriginalImages(savedSession.originalImages || []);
    setEditHistory(savedSession.editHistory || { past: [], present: [], future: [] });
    setPrompt(savedSession.prompt || '');
    setMode(savedSession.mode || 'edit');
    setAspectRatio(savedSession.aspectRatio || '16:9');
    setImageAspectRatio(savedSession.imageAspectRatio || null);
    setMaskDataUrl(savedSession.maskDataUrl || null);

    if (savedSession.generatedVideoDataUrl) {
        try {
            const blob = await dataURLtoBlob(savedSession.generatedVideoDataUrl);
            const objectUrl = URL.createObjectURL(blob);
            setGeneratedVideo({ blob, objectUrl });
        } catch (e) {
            console.error("Failed to restore video from saved session", e);
            setGeneratedVideo({ blob: null, objectUrl: null });
        }
    } else {
        setGeneratedVideo({ blob: null, objectUrl: null });
    }

    setSavedSession(null); // Hide the restore bar
  };

  const handleDismissSession = () => {
      clearAutoSave();
      setSavedSession(null);
  };

  const handleTemplateSelect = (templatePrompt: string) => {
    setPrompt(templatePrompt);
    setIsTemplatesOpen(false);
  };


  const renderResults = () => {
    if (originalImages.length === 0) return null;

    // Single image slider view
    if (mode === 'edit' && originalImages.length === 1 && editedImages.length === 1 && !isLoading && !isMasking) {
        return (
            <div className="relative group">
                <ImageSlider 
                  beforeSrc={originalImages[0].dataUrl} 
                  afterSrc={editedImages[0]}
                  onSave={() => handleSaveToLibrary('image', editedImages[0], prompt, originalImages[0].dataUrl)}
                  onDownload={() => handleDownload(editedImages[0], 0)}
                />
            </div>
        );
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
                                onSave={() => handleSaveToLibrary('image', editedImages[index], prompt, img.dataUrl)}
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
                    {mode === 'edit' ? (
                        <div className={`grid gap-4 ${originalImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} w-full`}>
                        {isLoading 
                            ? originalImages.map((_, index) => (
                                <MediaDisplay 
                                key={`loading-${index}`}
                                isLoading={true} 
                                mediaType="image"
                                loadingMessage={index === 0 ? loadingMessage : undefined} 
                                />
                            ))
                            : editedImages.length > 0
                            ? editedImages.map((img, index) => (
                                <MediaDisplay 
                                    key={`result-${index}`}
                                    src={img} 
                                    mediaType="image" 
                                    onDownload={() => handleDownload(img, index)}
                                    onSave={() => handleSaveToLibrary('image', img, prompt, originalImages[index].dataUrl)} 
                                />
                                ))
                            // When not loading, and no results, show a single placeholder.
                            : <MediaDisplay mediaType="image" />
                        }
                        </div>
                    ) : ( // mode === 'animate'
                        <MediaDisplay 
                        isLoading={isLoading}
                        src={generatedVideo.objectUrl}
                        mediaType="video"
                        loadingMessage={loadingMessage}
                        onDownload={generatedVideo.objectUrl ? () => handleVideoDownload(generatedVideo.objectUrl!) : undefined}
                        onSave={generatedVideo.blob ? handleSaveVideo : undefined}
                        />
                    )}
                </div>
            </div>
        </div>
    );
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8 relative">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Visionary AI Studio
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Edit images or create short video ads with simple text prompts.
          </p>
          <div className="absolute top-0 right-0">
            <UserProfile onOpenLibrary={() => setIsLibraryOpen(true)} onLogout={handleLogout} />
          </div>
        </header>
        
        <main className="space-y-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
            {originalImages.length === 0 ? (
                <ImageSourceSelector 
                  onImagesUpload={handleImagesUpload}
                  onOpenShopifyConnect={() => setIsShopifyConnectOpen(true)}
                />
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
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="prompt" className="block text-sm font-medium text-gray-300">
                                   {mode === 'edit' ? 'Editing' : 'Animation'} Prompt {mode === 'edit' && originalImages.length > 1 ? '(applied to all images)' : ''}
                                   {maskDataUrl && <span className="text-xs text-indigo-400 ml-2">(Mask Applied)</span>}
                                </label>
                                <button type="button" onClick={() => setIsTemplatesOpen(true)} className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.707 1.707A1 1 0 003 8v6a1 1 0 001 1h2.586l1.707 1.707A1 1 0 0010 16v1.414l1.293-1.293a1 1 0 01.707-.293h3a1 1 0 001-1V9a1 1 0 00-1-1h-1.414l-1.293-1.293A1 1 0 0010 6.414V5a1 1 0 00-1-1H5zm5-1a1 1 0 00-1 1v.414l.293.293a1 1 0 010 1.414L9 8.414V14a1 1 0 001 1h3a1 1 0 001-1V9a1 1 0 00-1-1h-.414l-1.293-1.293a1 1 0 00-1.414 0L10 7.414V3a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Templates
                                </button>
                            </div>
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
                                onClick={() => {
                                    setOriginalImages([]);
                                    clearAutoSave();
                                }}
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

        {savedSession && (
            <RestoreSessionBar
                onRestore={handleRestoreSession}
                onDismiss={handleDismissSession}
            />
        )}

        <LibraryModal 
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          library={library}
          onDownload={handleLibraryDownload}
          onDelete={handleRemoveFromLibrary}
        />
        
        <PromptTemplatesModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          onSelect={handleTemplateSelect}
          templates={PROMPT_TEMPLATES}
          currentMode={mode}
        />

        <DownloadModal
            isOpen={downloadModalState.isOpen}
            onClose={() => setDownloadModalState({ ...downloadModalState, isOpen: false })}
            onConfirm={handleConfirmDownload}
            imageDataUrl={downloadModalState.dataUrl}
            defaultFileName={downloadModalState.defaultFileName}
        />

        <ShopifyConnectModal
            isOpen={isShopifyConnectOpen}
            onClose={() => setIsShopifyConnectOpen(false)}
            onConnect={handleConnectToShopify}
            isLoading={shopifyLoading}
            error={shopifyError}
        />

        <ShopifyProductPicker
            isOpen={isShopifyPickerOpen}
            onClose={() => setIsShopifyPickerOpen(false)}
            products={shopifyProducts}
            onImport={handleShopifyImport}
            isLoading={shopifyLoading}
            error={shopifyError}
            storeUrl={shopifyStoreUrl}
        />

      </div>
    </div>
  );
};

export default App;