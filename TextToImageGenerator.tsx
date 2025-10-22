import React, { useState } from 'react';
import { generateImageFromText } from './services/geminiService';
import { ImageData } from './App';
import { GlowingEffect } from './GlowingEffect';
import LoadingSpinner from './LoadingSpinner';

interface TextToImageGeneratorProps {
    onImagesUpload: (imageData: ImageData[]) => void;
}

const TextToImageGenerator: React.FC<TextToImageGeneratorProps> = ({ onImagesUpload }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const dataUrlToImageData = (dataUrl: string): ImageData => {
        const [header, base64] = dataUrl.split(',');
        const mimeTypeMatch = header.match(/:(.*?);/);
        const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
        return { base64, mimeType, dataUrl };
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt to generate an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const dataUrl = await generateImageFromText(prompt);
            const imageData = dataUrlToImageData(dataUrl);
            onImagesUpload([imageData]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="relative w-full h-full rounded-lg border-2 border-dashed border-gray-600 p-6 text-center transition-colors flex flex-col items-center justify-center gap-4 hover:border-purple-400">
            <svg className="mx-auto h-12 w-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
            <span className="block text-sm font-semibold text-gray-400">Generate Image from Text</span>
            <div className="w-full space-y-2">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A robot holding a red skateboard"
                    rows={2}
                    className="block w-full text-sm rounded-md bg-gray-800 border-gray-600 shadow-sm text-white focus:border-indigo-500 focus:ring-indigo-500"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:bg-indigo-900/50"
                >
                    {isLoading ? <LoadingSpinner /> : 'Generate'}
                </button>
                 {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
            </div>
            <GlowingEffect disabled={false} proximity={20} spread={20} blur={10} />
        </div>
    );
};

export default TextToImageGenerator;