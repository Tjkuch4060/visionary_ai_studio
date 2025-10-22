import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageData } from './App';

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

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: ImageData) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please ensure you have granted permission in your browser settings.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      if(stream) {
        stopCamera();
      }
    };
  }, [isOpen, startCamera, stopCamera, stream]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
            if (blob) {
                const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                try {
                    const imageData = await fileToImageData(file);
                    onCapture(imageData);
                    onClose();
                } catch (err) {
                    setError("Failed to process captured image.");
                }
            }
        }, 'image/jpeg');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose} aria-modal="true" role="dialog">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl rounded-lg shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Take Photo</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-700" aria-label="Close camera">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>
        <main className="p-6">
          {error ? (
            <div className="text-red-400 text-center p-8 bg-red-900/20 rounded-md">{error}</div>
          ) : (
            <div className="relative w-full aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
              {!stream && <p className="text-gray-400 absolute">Starting camera...</p>}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </main>
        <footer className="px-6 py-4 bg-gray-800/50 rounded-b-lg flex justify-center gap-4">
          <button onClick={handleCapture} disabled={!stream || !!error} className="w-48 inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
            Capture Photo
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CameraCaptureModal;