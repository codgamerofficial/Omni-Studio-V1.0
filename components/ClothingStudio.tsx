import React, { useState, useCallback } from 'react';
import { designClothingFromText, designClothingFromImage } from '../services/geminiService';
import type { FileWithPreview } from '../types';
import { UploadIcon, ClothingIcon } from './icons';

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-cyber-cyan/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-2 border-cyber-magenta/50 rounded-full animate-spin"></div>
            <ClothingIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-cyan animate-flicker" />
        </div>
        <p className="font-display text-dark-text tracking-widest uppercase">Synthesizing Design...</p>
    </div>
);

const CyberPanel: React.FC<{ children: React.ReactNode, className?: string, as?: React.ElementType }> = ({ children, className, as: Component = 'div' }) => (
    <Component className={`relative bg-deep-space/50 backdrop-blur-sm border border-cyber-cyan/20 rounded-lg shadow-cyber-panel p-6 ${className}`}>
        <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-cyan rounded-tl-lg"></div>
        <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyber-cyan rounded-tr-lg"></div>
        <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyber-cyan rounded-bl-lg"></div>
        <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyber-cyan rounded-br-lg"></div>
        {children}
    </Component>
);

const NevelButton: React.FC<{ children: React.ReactNode, disabled?: boolean, type?: 'submit' }> = ({ children, disabled, type }) => (
    <button
        type={type}
        disabled={disabled}
        className="w-full mt-auto px-4 py-3 font-display font-bold text-light-text tracking-wider uppercase border border-cyber-magenta/50 rounded-md transition-all duration-150 shadow-nevel-up hover:shadow-cyber-glow-magenta active:shadow-nevel-down active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br from-space-cadet to-deep-space hover:from-space-cadet/80"
    >
        {children}
    </button>
);

const ImageUpload: React.FC<{ onFileSelect: (file: FileWithPreview | null) => void, selectedFile: FileWithPreview | null }> = ({ onFileSelect, selectedFile }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileWithPreview = Object.assign(file, {
                preview: URL.createObjectURL(file),
            });
            onFileSelect(fileWithPreview);
        }
    };
    
    return (
        <div className="w-full">
            <label htmlFor="image-upload-clothing" className="cursor-pointer">
                <div className="relative border-2 border-dashed border-cyber-cyan/30 rounded-lg p-6 text-center hover:border-cyber-cyan transition-colors bg-space-cadet/30">
                    {selectedFile ? (
                        <img src={selectedFile.preview} alt="Preview" className="mx-auto h-32 rounded-md object-contain" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadIcon className="w-12 h-12 text-dark-text" />
                            <p className="mt-2 text-sm text-dark-text">Upload Reference Image</p>
                        </div>
                    )}
                </div>
            </label>
            <input id="image-upload-clothing" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
        </div>
    );
};

export const ClothingStudio: React.FC = () => {
    const [mode, setMode] = useState<'generate' | 'edit'>('generate');
    const [textDescription, setTextDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState<FileWithPreview | null>(null);
    const [editInstructions, setEditInstructions] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const textareaClass = "w-full bg-space-cadet/50 border border-cyber-cyan/30 rounded-md px-3 py-2 text-light-text placeholder-dark-text/70 focus:outline-none focus:ring-2 focus:ring-cyber-magenta focus:border-cyber-magenta shadow-nevel-down transition-shadow";

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let response: string;
            if (mode === 'generate') {
                if (!textDescription) {
                    setError('Please provide a description.');
                    setIsLoading(false);
                    return;
                }
                response = await designClothingFromText(textDescription);
            } else {
                if (!uploadedFile || !editInstructions) {
                    setError('Please upload an image and provide edit instructions.');
                    setIsLoading(false);
                    return;
                }
                response = await designClothingFromImage(uploadedFile, editInstructions);
            }
            setResult(response);
        } catch (err) {
            setError('Failed to generate clothing design. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [mode, textDescription, uploadedFile, editInstructions]);

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <CyberPanel as="div" className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-4 animate-flicker">Apparel Design Core</h2>
                <div className="flex border border-cyber-cyan/30 rounded-lg p-1 mb-6 bg-space-cadet/30">
                    <button onClick={() => setMode('generate')} className={`flex-1 py-2 rounded-md transition text-sm font-semibold ${mode === 'generate' ? 'bg-cyber-cyan text-deep-space shadow' : 'hover:bg-space-cadet/50 text-dark-text'}`}>Generate</button>
                    <button onClick={() => setMode('edit')} className={`flex-1 py-2 rounded-md transition text-sm font-semibold ${mode === 'edit' ? 'bg-cyber-cyan text-deep-space shadow' : 'hover:bg-space-cadet/50 text-dark-text'}`}>Edit</button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4 overflow-y-auto pr-2">
                    {mode === 'generate' ? (
                        <textarea
                            value={textDescription}
                            onChange={(e) => setTextDescription(e.target.value)}
                            placeholder="Describe your design: fabric, silhouette, season, etc. e.g., lightweight summer kurta for men, breathable cotton..."
                            rows={10}
                            className={`${textareaClass} flex-grow`}
                        />
                    ) : (
                        <div className="flex flex-col space-y-4 flex-grow">
                            <ImageUpload onFileSelect={setUploadedFile} selectedFile={uploadedFile} />
                            <textarea
                                value={editInstructions}
                                onChange={(e) => setEditInstructions(e.target.value)}
                                placeholder="Describe the changes you want to make..."
                                rows={5}
                                className={textareaClass}
                            />
                        </div>
                    )}
                    <NevelButton type="submit" disabled={isLoading}>
                        {isLoading ? 'Designing...' : (mode === 'generate' ? 'Generate Design' : 'Edit Design')}
                    </NevelButton>
                </form>
            </CyberPanel>
            <CyberPanel className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-6">Design Schematics</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading && <Loader />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-500">{error}</div>}
                    {result && !isLoading && (
                         <div className="prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-light-text prose-headings:font-display prose-strong:text-cyber-cyan" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>
                    )}
                    {!result && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full text-center text-dark-text">
                            <p className="font-display tracking-widest">AWAITING INPUT...</p>
                        </div>
                    )}
                </div>
            </CyberPanel>
        </div>
    );
};