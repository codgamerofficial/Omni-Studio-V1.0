import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';
import { VideoIcon, SparklesIcon, DownloadIcon } from './icons';

if (typeof window.aistudio === 'undefined') {
    (window as any).aistudio = {
        hasSelectedApiKey: async () => true,
        openSelectKey: async () => {
            alert("This would open the API key selection dialog. We'll assume it's selected now.");
            (window as any).aistudio.hasSelectedApiKey = async () => true;
        },
    };
}

const loadingMessages = [
    "Initializing Render Core...",
    "Compiling Visual Data Stream...",
    "Allocating Photonic Processors...",
    "Rendering Quantum Frames...",
    "This can take a few minutes. Great art takes time!",
    "Enhancing Chromatic Aberration...",
    "Finalizing Holo-Sequence..."
];

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-cyber-cyan/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-2 border-cyber-magenta/50 rounded-full animate-spin"></div>
            <VideoIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-cyan animate-flicker" />
        </div>
        <p className="text-dark-text text-lg font-display tracking-widest">{message}</p>
    </div>
);

const NevelButton: React.FC<{ children: React.ReactNode, onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void, disabled?: boolean, type?: 'button' | 'submit', fullWidth?: boolean, ariaLabel?: string }> = 
({ children, onClick, disabled, type = 'button', fullWidth, ariaLabel }) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={`px-4 py-3 font-display font-bold text-light-text tracking-wider uppercase border border-cyber-magenta/50 rounded-md transition-all duration-150 shadow-nevel-up hover:shadow-cyber-glow-magenta active:shadow-nevel-down active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} bg-gradient-to-br from-space-cadet to-deep-space hover:from-space-cadet/80`}
    >
        {children}
    </button>
);

const CyberPanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`relative bg-deep-space/50 backdrop-blur-sm border border-cyber-cyan/20 rounded-lg shadow-cyber-panel p-6 ${className}`}>
      <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-cyan rounded-tl-lg"></div>
      <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyber-cyan rounded-tr-lg"></div>
      <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyber-cyan rounded-bl-lg"></div>
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyber-cyan rounded-br-lg"></div>
      {children}
    </div>
);

export const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const inputClass = "w-full bg-space-cadet/50 border border-cyber-cyan/30 rounded-md px-3 py-2 text-light-text placeholder-dark-text/70 focus:outline-none focus:ring-2 focus:ring-cyber-magenta focus:border-cyber-magenta shadow-nevel-down transition-shadow";

    const checkApiKey = useCallback(async () => {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } catch (e) {
            console.error("Error checking API key:", e);
            setApiKeySelected(false);
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);
    
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isLoading) {
            interval = setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleSelectKey = async () => {
        await window.aistudio.openSelectKey();
        setApiKeySelected(true); 
    };
    
    const handleDownload = async () => {
        if (!generatedVideoUrl) return;
        setIsDownloading(true);
        try {
            const response = await fetch(generatedVideoUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `OmniStudio-Video-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (err) {
            console.error("Download failed:", err);
            setError("Download failed. Please try right-clicking the video and selecting 'Save Video As...'");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        setLoadingMessage(loadingMessages[0]);

        try {
            const videoUrl = await generateVideo(prompt);
            setGeneratedVideoUrl(videoUrl);
        } catch (err: any) {
             let errorMessage = 'Failed to generate video. Please try again.';
             if (err.message && err.message.includes("Requested entity was not found")) {
                errorMessage = "API Key not found or invalid. Please select a valid API key.";
                setApiKeySelected(false);
             }
             setError(errorMessage);
             console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!apiKeySelected) {
        return (
            <div className="flex items-center justify-center h-full">
                <CyberPanel className="max-w-md mx-auto text-center">
                    <h2 className="text-2xl font-display font-bold text-light-text mb-4 animate-flicker">ACCESS KEY REQUIRED</h2>
                    <p className="text-dark-text mb-6">Video synthesis requires a verified operator key for resource allocation and billing.</p>
                    <NevelButton onClick={handleSelectKey} fullWidth>
                        Authenticate
                    </NevelButton>
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-cyber-cyan hover:underline hover:text-cyber-magenta">
                        View Resource Allocation Docs
                    </a>
                </CyberPanel>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-full">
            <header className="mb-8">
                <h2 className="text-3xl font-display font-bold text-light-text mb-1 animate-flicker">Video Synthesis</h2>
                <p className="text-lg text-dark-text">Input parameters. AI will generate a corresponding motion-visual sequence.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                <CyberPanel as="form" onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <label htmlFor="video-prompt" className="font-display font-semibold text-light-text">Scene Parameters</label>
                    <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving at top speed"
                        rows={6}
                        className={`${inputClass} flex-grow`}
                    />
                    <NevelButton type="submit" disabled={isLoading || !prompt} fullWidth>
                        <span className="flex items-center justify-center gap-2">
                           {isLoading ? 'Synthesizing...' : <><SparklesIcon className="w-5 h-5" /><span>Render Video</span></>}
                        </span>
                    </NevelButton>
                </CyberPanel>

                <CyberPanel className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-full flex-grow flex items-center justify-center">
                        {isLoading && <Loader message={loadingMessage} />}
                        {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md text-center border border-red-500">{error}</div>}
                        {generatedVideoUrl && !isLoading && (
                            <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-cyber-glow-magenta" />
                        )}
                        {!generatedVideoUrl && !isLoading && !error && (
                            <div className="text-center text-dark-text">
                                <VideoIcon className="w-24 h-24 mx-auto text-space-cadet" />
                                <p className="mt-2 font-display tracking-widest">OUTPUT DISPLAY</p>
                            </div>
                        )}
                    </div>
                    {generatedVideoUrl && !isLoading && (
                        <NevelButton onClick={handleDownload} disabled={isDownloading}>
                             <span className="flex items-center justify-center gap-2">
                                <DownloadIcon className="w-5 h-5"/>
                                {isDownloading ? 'Exporting...' : 'Export MP4'}
                            </span>
                        </NevelButton>
                    )}
                </CyberPanel>
            </div>
        </div>
    );
};