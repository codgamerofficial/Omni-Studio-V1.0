
import React, { useState, useEffect, useCallback } from 'react';
import { generateVideo } from '../services/geminiService';

// Mock aistudio object for development if it doesn't exist
if (typeof window.aistudio === 'undefined') {
    (window as any).aistudio = {
        hasSelectedApiKey: async () => true, // Set to false to test the selection flow
        openSelectKey: async () => {
            alert("This would open the API key selection dialog. We'll assume it's selected now.");
            (window as any).aistudio.hasSelectedApiKey = async () => true;
        },
    };
}

const loadingMessages = [
    "Warming up the director's chair...",
    "Storyboarding your vision...",
    "Sending instructions to the camera crew...",
    "Rendering the first few frames...",
    "This can take a few minutes. Great art takes time!",
    "Polishing the final cut...",
    "Almost there, adding the final touches..."
];

const Loader: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-dotted rounded-full animate-spin"></div>
        <p className="text-dark-text-secondary text-lg">Generating Video</p>
        <p className="text-dark-text-secondary text-center max-w-sm">{message}</p>
    </div>
);

export const VideoStudio: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);
    const [error, setError] = useState<string | null>(null);
    const [apiKeySelected, setApiKeySelected] = useState(false);

    const checkApiKey = useCallback(async () => {
        try {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setApiKeySelected(hasKey);
        } catch (e) {
            console.error("Error checking API key:", e);
            setApiKeySelected(false); // Assume no key on error
        }
    }, []);

    useEffect(() => {
        checkApiKey();
    }, [checkApiKey]);
    
    useEffect(() => {
        // FIX: Replace NodeJS.Timeout with a browser-compatible type.
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
        // Assume key selection is successful and update state to enable the form
        setApiKeySelected(true); 
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
            <div className="max-w-2xl mx-auto text-center flex flex-col items-center justify-center h-full">
                <h2 className="text-3xl font-bold text-dark-text-primary mb-4">API Key Required</h2>
                <p className="text-dark-text-secondary mb-6">Video generation with Veo requires you to select a personal API key. This ensures proper billing and usage tracking.</p>
                <button onClick={handleSelectKey} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-md transition duration-300">
                    Select API Key
                </button>
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-brand-secondary hover:underline">
                    Learn more about billing
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-full">
            <h2 className="text-3xl font-bold text-dark-text-primary mb-2">Video Studio</h2>
            <p className="text-dark-text-secondary mb-6">Bring your ideas to life. Describe a scene and let our AI director create a stunning video for you.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow">
                <form onSubmit={handleSubmit} className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col space-y-4">
                    <label htmlFor="video-prompt" className="font-semibold text-dark-text-primary">Your Idea</label>
                    <textarea
                        id="video-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A neon hologram of a cat driving at top speed"
                        rows={6}
                        className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary flex-grow"
                    />
                    <button type="submit" disabled={isLoading || !prompt} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Generating...' : 'Create Video'}
                    </button>
                </form>

                <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex items-center justify-center">
                    {isLoading && <Loader message={loadingMessage} />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md text-center">{error}</div>}
                    {generatedVideoUrl && !isLoading && (
                        <video src={generatedVideoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg" />
                    )}
                    {!generatedVideoUrl && !isLoading && !error && (
                        <div className="text-center text-dark-text-secondary">
                             <p>Your generated video will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};