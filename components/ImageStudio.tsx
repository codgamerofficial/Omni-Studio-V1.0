import React, { useState, useCallback } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import type { FileWithPreview } from '../types';
import { UploadIcon, ImageIcon, SparklesIcon, CameraIcon } from './icons';
import { CameraCapture } from './CameraCapture';

const Loader: React.FC<{text: string}> = ({text}) => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-cyber-cyan/30 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-cyber-magenta/50 rounded-full animate-spin"></div>
            <ImageIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-cyan animate-flicker" />
        </div>
        <p className="font-display text-dark-text tracking-widest uppercase">{text}</p>
    </div>
);

const NevelButton: React.FC<{ children: React.ReactNode, onClick?: () => void, disabled?: boolean, type?: 'button' | 'submit', fullWidth?: boolean, ariaLabel?: string, as?: 'button' | 'label', htmlFor?: string, className?: string }> = 
({ children, onClick, disabled, type = 'button', fullWidth, ariaLabel, as = 'button', htmlFor, className }) => {
    const Component = as;
    const commonProps = {
        onClick: onClick,
        disabled: disabled,
        "aria-label": ariaLabel,
        className: `flex items-center justify-center text-center px-4 py-2 font-display font-bold text-sm text-light-text tracking-wider uppercase border border-cyber-cyan/50 rounded-md transition-all duration-150 shadow-nevel-up hover:shadow-cyber-glow-cyan active:shadow-nevel-down active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} bg-gradient-to-br from-space-cadet to-deep-space hover:from-space-cadet/80 cursor-pointer ${className}`
    };

    if (Component === 'button') {
        return <button type={type} {...commonProps}>{children}</button>;
    }
    return <label htmlFor={htmlFor} {...commonProps}>{children}</label>;
};

const ImageUpload: React.FC<{ onFileSelect: (file: FileWithPreview | null) => void, selectedFile: FileWithPreview | null }> = ({ onFileSelect, selectedFile }) => {
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileWithPreview = Object.assign(file, {
                preview: URL.createObjectURL(file),
            });
            onFileSelect(fileWithPreview);
        }
    };

    const handleCapture = (file: File) => {
        const fileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file),
        });
        onFileSelect(fileWithPreview);
        setIsCameraOpen(false);
    };
    
    return (
        <>
            <div className="w-full space-y-4">
                <div className="relative border-2 border-dashed border-cyber-cyan/50 rounded-lg p-6 text-center bg-space-cadet/30">
                    {selectedFile ? (
                        <img src={selectedFile.preview} alt="Preview" className="mx-auto h-32 rounded-md object-contain border border-cyber-magenta/30" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadIcon className="w-12 h-12 text-dark-text" />
                            <p className="mt-2 text-sm text-dark-text">Awaiting Image Data...</p>
                        </div>
                    )}
                </div>
                <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />

                <div className="grid grid-cols-2 gap-4">
                    <NevelButton as="label" htmlFor="image-upload">
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Upload
                    </NevelButton>
                    <NevelButton type="button" onClick={() => setIsCameraOpen(true)}>
                        <CameraIcon className="w-5 h-5 mr-2" />
                        Take Photo
                    </NevelButton>
                </div>
            </div>
            {isCameraOpen && (
                <CameraCapture 
                    onCapture={handleCapture}
                    onClose={() => setIsCameraOpen(false)}
                />
            )}
        </>
    );
};

const CyberPanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`relative bg-deep-space/50 backdrop-blur-sm border border-cyber-cyan/20 rounded-lg shadow-cyber-panel p-6 ${className}`}>
    <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-cyan rounded-tl-lg"></div>
    <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyber-cyan rounded-tr-lg"></div>
    <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyber-cyan rounded-bl-lg"></div>
    <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyber-cyan rounded-br-lg"></div>
    {children}
  </div>
);

type FilterType = 'original' | 'grayscale' | 'sepia' | 'invert';

const filters: { id: FilterType; name: string }[] = [
    { id: 'original', name: 'Original' },
    { id: 'grayscale', name: 'Grayscale' },
    { id: 'sepia', name: 'Sepia' },
    { id: 'invert', name: 'Invert' },
];

const filterClasses: Record<FilterType, string> = {
    original: '',
    grayscale: 'grayscale',
    sepia: 'sepia',
    invert: 'invert',
};

export const ImageStudio: React.FC = () => {
    const [mode, setMode] = useState<'generate' | 'edit'>('generate');
    const [prompt, setPrompt] = useState('');
    const [editInstructions, setEditInstructions] = useState('');
    const [uploadedFile, setUploadedFile] = useState<FileWithPreview | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterType>('original');
    const inputClass = "w-full bg-space-cadet/50 border border-cyber-cyan/30 rounded-md px-3 py-2 text-light-text placeholder-dark-text/70 focus:outline-none focus:ring-2 focus:ring-cyber-magenta focus:border-cyber-magenta shadow-nevel-down transition-shadow";

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if ((mode === 'generate' && !prompt) || (mode === 'edit' && (!uploadedFile || !editInstructions))) {
            setError('Please fill all required fields.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        setActiveFilter('original');

        try {
            let imageUrl: string;
            if (mode === 'generate') {
                imageUrl = await generateImage(prompt);
            } else {
                imageUrl = await editImage(uploadedFile!, editInstructions);
            }
            setGeneratedImage(imageUrl);
        } catch (err) {
            setError('Failed to process image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [mode, prompt, uploadedFile, editInstructions]);

    return (
        <div className="max-w-7xl mx-auto flex flex-col h-full">
            <header className="mb-8">
                <h2 className="text-3xl font-display font-bold text-light-text mb-1 animate-flicker">Image Synthesis</h2>
                <p className="text-lg text-dark-text">Generate novel visual data or modify existing assets via neural network.</p>
            </header>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
                <CyberPanel className="lg:col-span-1 flex flex-col">
                    <div className="flex border border-cyber-cyan/30 rounded-lg p-1 mb-6 bg-space-cadet/30">
                        <button onClick={() => setMode('generate')} className={`flex-1 py-2 rounded-md transition text-sm font-semibold ${mode === 'generate' ? 'bg-cyber-cyan text-deep-space shadow' : 'hover:bg-space-cadet/50 text-dark-text'}`}>Generate</button>
                        <button onClick={() => setMode('edit')} className={`flex-1 py-2 rounded-md transition text-sm font-semibold ${mode === 'edit' ? 'bg-cyber-cyan text-deep-space shadow' : 'hover:bg-space-cadet/50 text-dark-text'}`}>Edit</button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4">
                        {mode === 'generate' ? (
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A modern streetwear hoodie mockup, charcoal gray with reflective silver piping..."
                                rows={5}
                                className={`${inputClass} flex-grow`}
                            />
                        ) : (
                            <div className="flex flex-col space-y-4 flex-grow">
                                <ImageUpload onFileSelect={setUploadedFile} selectedFile={uploadedFile} />
                                <textarea
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                    placeholder="e.g., Add a llama next to the person"
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>
                        )}
                        <NevelButton type="submit" disabled={isLoading} fullWidth className="py-3 mt-auto">
                            <span className="flex items-center justify-center gap-2">
                                <SparklesIcon className="w-5 h-5"/>
                                {isLoading ? 'Processing...' : (mode === 'generate' ? 'Generate' : 'Apply Edit')}
                            </span>
                        </NevelButton>
                    </form>
                </CyberPanel>

                <CyberPanel className="lg:col-span-2 flex flex-col items-center justify-center p-4">
                    {isLoading && <Loader text={mode === 'generate' ? 'Generating...' : 'Applying Edits...'} />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-500">{error}</div>}
                    
                    {generatedImage && !isLoading && (
                        <div className="flex flex-col items-center justify-center w-full h-full flex-grow">
                            <div className="flex-grow w-full flex items-center justify-center overflow-hidden p-2">
                                <img 
                                    src={generatedImage} 
                                    alt="Generated content" 
                                    className={`max-w-full max-h-full rounded-lg object-contain shadow-cyber-glow-magenta transition-all duration-300 ${filterClasses[activeFilter]}`} 
                                />
                            </div>
                            <div className="mt-4 flex-shrink-0">
                                <div className="flex items-center justify-center gap-2 sm:gap-4 p-2 bg-space-cadet/50 border border-cyber-cyan/20 rounded-full shadow-nevel-down">
                                    {filters.map((filter) => {
                                        const isActive = activeFilter === filter.id;
                                        return (
                                            <button
                                                key={filter.id}
                                                onClick={() => setActiveFilter(filter.id)}
                                                aria-pressed={isActive}
                                                className={`px-4 py-1.5 text-xs sm:text-sm font-display font-bold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep-space focus:ring-cyber-magenta ${
                                                    isActive
                                                    ? 'bg-cyber-cyan text-deep-space shadow-cyber-glow-cyan'
                                                    : 'bg-transparent text-dark-text hover:bg-space-cadet hover:text-light-text'
                                                }`}
                                            >
                                                {filter.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!generatedImage && !isLoading && !error && (
                        <div className="text-center text-dark-text">
                            <ImageIcon className="w-24 h-24 mx-auto text-space-cadet" />
                            <p className="mt-2 font-display tracking-widest">OUTPUT DISPLAY</p>
                        </div>
                    )}
                </CyberPanel>
            </div>
        </div>
    );
};