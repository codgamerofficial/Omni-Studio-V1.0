
import React, { useState, useCallback } from 'react';
import { analyzeInterior } from '../services/geminiService';
import type { FileWithPreview } from '../types';
import { UploadIcon } from './icons';

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-2">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="text-dark-text-secondary">Analyzing your space...</span>
    </div>
);

const ImageUploadMultiple: React.FC<{
    onFilesSelect: (files: FileWithPreview[]) => void;
    selectedFiles: FileWithPreview[];
}> = ({ onFilesSelect, selectedFiles }) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Explicitly type `file` as `File` to resolve issue where its type was inferred as `unknown`.
            const newFiles = Array.from(e.target.files).map((file: File) => Object.assign(file, {
                preview: URL.createObjectURL(file)
            }));
            onFilesSelect([...selectedFiles, ...newFiles]);
        }
    };
    
    return (
        <div>
            <label htmlFor="image-upload-interior" className="cursor-pointer block border-2 border-dashed border-dark-border rounded-lg p-6 text-center hover:border-brand-primary transition-colors">
                <UploadIcon className="w-12 h-12 text-dark-text-secondary mx-auto" />
                <p className="mt-2 text-sm text-dark-text-secondary">Click to upload photos of your room</p>
            </label>
            <input id="image-upload-interior" type="file" className="hidden" accept="image/png, image/jpeg" multiple onChange={handleFileChange} />
            {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
                    {selectedFiles.map((file, index) => (
                        <img key={index} src={file.preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                    ))}
                </div>
            )}
        </div>
    );
};

export const InteriorStudio: React.FC = () => {
    const [files, setFiles] = useState<FileWithPreview[]>([]);
    const [preferences, setPreferences] = useState({
        roomType: 'bedroom',
        budget: 'medium',
        style: 'modern',
        requirements: ''
    });
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePrefChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPreferences(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) {
            setError('Please upload at least one photo of your room.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await analyzeInterior(files, preferences);
            setResult(response);
        } catch (err) {
            setError('Failed to generate design ideas. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [files, preferences]);

    const roomTypes = ["bedroom", "hall", "kitchen", "dining", "bathroom", "study", "drawing room", "terrace", "rooftop_pool", "garden", "playground"];
    const budgets = ["low", "medium", "high"];
    const styles = ["modern", "boho", "minimal", "Scandinavian", "Indian ethnic", "tropical"];

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Interior Design Studio</h2>
                <p className="text-dark-text-secondary mb-6">Upload photos of your space, tell us your style, and get professional redesign plans.</p>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <ImageUploadMultiple onFilesSelect={setFiles} selectedFiles={files} />
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select name="roomType" value={preferences.roomType} onChange={handlePrefChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                            {roomTypes.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}</option>)}
                        </select>
                         <select name="budget" value={preferences.budget} onChange={handlePrefChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                            {budgets.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                        </select>
                    </div>
                    <select name="style" value={preferences.style} onChange={handlePrefChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary">
                        {styles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <textarea name="requirements" value={preferences.requirements} onChange={handlePrefChange} placeholder="Any special requirements? (e.g., 2 beds, 1 workstation, child safe)" rows={3} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary"></textarea>
                    
                    <button type="submit" disabled={isLoading || files.length === 0} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Generating Ideas...' : 'Get Design Ideas'}
                    </button>
                </form>
            </div>
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-6">Your Redesign Plan</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading && <Loader />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                    {result && !isLoading && (
                        <div className="prose prose-invert max-w-none prose-p:text-dark-text-secondary prose-headings:text-dark-text-primary" dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br />') }}></div>
                    )}
                    {!result && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full text-center text-dark-text-secondary">
                            <p>Your personalized interior design plan will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};