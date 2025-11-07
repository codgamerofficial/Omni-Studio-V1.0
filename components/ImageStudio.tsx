
import React, { useState, useCallback } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import type { FileWithPreview } from '../types';
// FIX: Import ImageIcon to be used when no image is generated yet.
import { UploadIcon, ImageIcon } from './icons';

const Loader: React.FC<{text: string}> = ({text}) => (
    <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-dark-text-secondary">{text}</span>
    </div>
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
            <label htmlFor="image-upload" className="cursor-pointer">
                <div className="relative border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-brand-primary transition-colors">
                    {selectedFile ? (
                        <img src={selectedFile.preview} alt="Preview" className="mx-auto h-32 rounded-md object-contain" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadIcon className="w-12 h-12 text-dark-text-secondary" />
                            <p className="mt-2 text-sm text-dark-text-secondary">Click to upload an image to edit</p>
                        </div>
                    )}
                </div>
            </label>
            <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
        </div>
    );
};


export const ImageStudio: React.FC = () => {
    const [mode, setMode] = useState<'generate' | 'edit'>('generate');
    const [prompt, setPrompt] = useState('');
    const [editInstructions, setEditInstructions] = useState('');
    const [uploadedFile, setUploadedFile] = useState<FileWithPreview | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if ((mode === 'generate' && !prompt) || (mode === 'edit' && (!uploadedFile || !editInstructions))) {
            setError('Please fill all required fields.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

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
            <h2 className="text-3xl font-bold text-dark-text-primary mb-2">Image Studio</h2>
            <p className="text-dark-text-secondary mb-6">Create stunning visuals from your imagination or edit existing images with AI.</p>
            
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                    <div className="flex border border-dark-border rounded-lg p-1 mb-6">
                        <button onClick={() => setMode('generate')} className={`flex-1 py-2 rounded-md transition ${mode === 'generate' ? 'bg-brand-primary text-white' : 'hover:bg-dark-border'}`}>Generate</button>
                        <button onClick={() => setMode('edit')} className={`flex-1 py-2 rounded-md transition ${mode === 'edit' ? 'bg-brand-primary text-white' : 'hover:bg-dark-border'}`}>Edit</button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4">
                        {mode === 'generate' ? (
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A modern streetwear hoodie mockup, charcoal gray with reflective silver piping..."
                                rows={5}
                                className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary flex-grow"
                            />
                        ) : (
                            <div className="flex flex-col space-y-4 flex-grow">
                                <ImageUpload onFileSelect={setUploadedFile} selectedFile={uploadedFile} />
                                <textarea
                                    value={editInstructions}
                                    onChange={(e) => setEditInstructions(e.target.value)}
                                    placeholder="e.g., Add a llama next to the person"
                                    rows={3}
                                    className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                        )}
                        <button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500">
                            {isLoading ? 'Processing...' : (mode === 'generate' ? 'Generate Image' : 'Edit Image')}
                        </button>
                    </form>
                </div>

                {/* Output */}
                <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex items-center justify-center">
                    {isLoading && <Loader text={mode === 'generate' ? 'Generating image...' : 'Applying edits...'} />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                    {generatedImage && !isLoading && (
                        <img src={generatedImage} alt="Generated content" className="max-w-full max-h-full rounded-lg object-contain" />
                    )}
                    {!generatedImage && !isLoading && !error && (
                        <div className="text-center text-dark-text-secondary">
                            <ImageIcon className="w-24 h-24 mx-auto text-dark-border" />
                            <p>Your masterpiece will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};