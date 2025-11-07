
import React, { useState, useCallback } from 'react';
import { designClothingFromText, designClothingFromImage } from '../services/geminiService';
import type { FileWithPreview } from '../types';
import { UploadIcon } from './icons';

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-dark-text-secondary">Designing your fashion piece...</span>
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
            <label htmlFor="image-upload-clothing" className="cursor-pointer">
                <div className="relative border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-brand-primary transition-colors">
                    {selectedFile ? (
                        <img src={selectedFile.preview} alt="Preview" className="mx-auto h-32 rounded-md object-contain" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <UploadIcon className="w-12 h-12 text-dark-text-secondary" />
                            <p className="mt-2 text-sm text-dark-text-secondary">Click to upload a photo to edit</p>
                        </div>
                    )}
                </div>
            </label>
            <input id="image-upload-clothing" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
        </div>
    );
};

export const ClothingStudio: React.FC = () => {
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [textDescription, setTextDescription] = useState('');
    const [uploadedFile, setUploadedFile] = useState<FileWithPreview | null>(null);
    const [editInstructions, setEditInstructions] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            let response: string;
            if (mode === 'text') {
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
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Fashion Design Studio</h2>
                <div className="flex border border-dark-border rounded-lg p-1 mb-6">
                    <button onClick={() => setMode('text')} className={`flex-1 py-2 rounded-md transition ${mode === 'text' ? 'bg-brand-primary text-white' : 'hover:bg-dark-border'}`}>From Text</button>
                    <button onClick={() => setMode('image')} className={`flex-1 py-2 rounded-md transition ${mode === 'image' ? 'bg-brand-primary text-white' : 'hover:bg-dark-border'}`}>From Image</button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4 overflow-y-auto pr-2">
                    {mode === 'text' ? (
                        <textarea
                            value={textDescription}
                            onChange={(e) => setTextDescription(e.target.value)}
                            placeholder="Describe your design: fabric, silhouette, season, etc. e.g., lightweight summer kurta for men, breathable cotton..."
                            rows={10}
                            className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary flex-grow"
                        />
                    ) : (
                        <div className="flex flex-col space-y-4 flex-grow">
                            <ImageUpload onFileSelect={setUploadedFile} selectedFile={uploadedFile} />
                            <textarea
                                value={editInstructions}
                                onChange={(e) => setEditInstructions(e.target.value)}
                                placeholder="Describe the changes you want to make..."
                                rows={5}
                                className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"
                            />
                        </div>
                    )}
                    <button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Designing...' : 'Generate Design'}
                    </button>
                </form>
            </div>
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-6">Your Design Concept</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading && <Loader />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                    {result && !isLoading && (
                         <div className="prose prose-invert max-w-none prose-p:text-dark-text-secondary prose-headings:text-dark-text-primary" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>
                    )}
                    {!result && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full text-center text-dark-text-secondary">
                            <p>Your fashion design breakdown will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
