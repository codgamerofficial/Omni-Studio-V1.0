import React, { useState, useCallback } from 'react';
import { analyzeInterior } from '../services/geminiService';
import type { FileWithPreview } from '../types';
import { UploadIcon, InteriorIcon } from './icons';

const Loader: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-cyber-cyan/30 rounded-full animate-pulse"></div>
            <div className="absolute inset-2 border-2 border-cyber-magenta/50 rounded-full animate-spin"></div>
            <InteriorIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-cyan animate-flicker" />
        </div>
        <p className="font-display text-dark-text tracking-widest uppercase">Analyzing Environment...</p>
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

const ImageUploadMultiple: React.FC<{
    onFilesSelect: (files: FileWithPreview[]) => void;
    selectedFiles: FileWithPreview[];
}> = ({ onFilesSelect, selectedFiles }) => {
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map((file: File) => Object.assign(file, {
                preview: URL.createObjectURL(file)
            }));
            onFilesSelect([...selectedFiles, ...newFiles]);
        }
    };
    
    return (
        <div>
            <label htmlFor="image-upload-interior" className="cursor-pointer block border-2 border-dashed border-cyber-cyan/30 rounded-lg p-6 text-center hover:border-cyber-cyan transition-colors bg-space-cadet/30">
                <UploadIcon className="w-12 h-12 text-dark-text mx-auto" />
                <p className="mt-2 text-sm text-dark-text">Upload Environmental Scans</p>
                <span className="text-xs text-dark-text/70">Multiple files accepted</span>
            </label>
            <input id="image-upload-interior" type="file" className="hidden" accept="image/png, image/jpeg" multiple onChange={handleFileChange} />
            {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-4">
                    {selectedFiles.map((file, index) => (
                        <img key={index} src={file.preview} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md border-2 border-cyber-cyan/20" />
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
    const selectClass = "w-full bg-space-cadet/50 border border-cyber-cyan/30 rounded-md px-3 py-2 text-light-text placeholder-dark-text/70 focus:outline-none focus:ring-2 focus:ring-cyber-magenta focus:border-cyber-magenta shadow-nevel-down transition-shadow";
    const textareaClass = `${selectClass} min-h-[80px]`;

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
    const styles = ["modern", "boho", "minimal", "Scandinavian", "Indian ethnic", "tropical", "cyberpunk", "industrial"];

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <CyberPanel as="div" className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-2 animate-flicker">Habitat Reconfiguration</h2>
                <p className="text-dark-text mb-6">Submit environmental scans and design parameters for AI-driven architectural solutions.</p>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow flex flex-col">
                    <ImageUploadMultiple onFilesSelect={setFiles} selectedFiles={files} />
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <select name="roomType" value={preferences.roomType} onChange={handlePrefChange} className={selectClass}>
                            {roomTypes.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1).replace('_', ' ')}</option>)}
                        </select>
                         <select name="budget" value={preferences.budget} onChange={handlePrefChange} className={selectClass}>
                            {budgets.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                        </select>
                    </div>
                    <select name="style" value={preferences.style} onChange={handlePrefChange} className={selectClass}>
                        {styles.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                    <textarea name="requirements" value={preferences.requirements} onChange={handlePrefChange} placeholder="Special requirements (e.g., 2 beds, 1 workstation, child safe)..." rows={3} className={textareaClass}></textarea>
                    
                    <NevelButton type="submit" disabled={isLoading || files.length === 0}>
                        {isLoading ? 'Generating Blueprints...' : 'Generate Plan'}
                    </NevelButton>
                </form>
            </CyberPanel>
            <CyberPanel className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-6">Reconfiguration Plan</h2>
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