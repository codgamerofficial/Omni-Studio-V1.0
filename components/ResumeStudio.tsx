import React, { useState, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { generateResume } from '../services/geminiService';
import { SparklesIcon, DownloadIcon } from './icons';

const Loader: React.FC<{ text: string }> = ({ text }) => (
    <div className="flex flex-col items-center justify-center space-y-4 text-center h-full">
        <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-cyber-cyan/30 rounded-full"></div>
            <div className="absolute inset-2 border-2 border-cyber-magenta/50 rounded-full animate-spin"></div>
            <SparklesIcon className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyber-cyan animate-flicker" />
        </div>
        <p className="font-display text-dark-text tracking-widest uppercase">{text}</p>
    </div>
);

type OutputTab = 'ats' | 'human' | 'keywords';

const CyberPanel: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
  <div className={`relative bg-deep-space/50 backdrop-blur-sm border border-cyber-cyan/20 rounded-lg shadow-cyber-panel p-6 ${className}`}>
    <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyber-cyan rounded-tl-lg"></div>
    <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyber-cyan rounded-tr-lg"></div>
    <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyber-cyan rounded-bl-lg"></div>
    <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyber-cyan rounded-br-lg"></div>
    {children}
  </div>
);

const NevelButton: React.FC<{ children: React.ReactNode, onClick?: () => void, disabled?: boolean, type?: 'button' | 'submit', fullWidth?: boolean, ariaLabel?: string }> = 
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


export const ResumeStudio: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        current_role: '',
        raw_resume_text_or_upload: '',
        target_titles: '',
        skills_list: '',
        ats_score: '',
    });
    const [result, setResult] = useState<{ ats: string; human: string; keywords: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<OutputTab>('human');
    const [isExporting, setIsExporting] = useState(false);
    const humanReadableRef = useRef<HTMLDivElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const response = await generateResume(formData);
            
            const atsResume = response.substring(response.indexOf("ATS_RESUME:") + "ATS_RESUME:".length, response.indexOf("HUMAN_RESUME:")).trim();
            const humanResume = response.substring(response.indexOf("HUMAN_RESUME:") + "HUMAN_RESUME:".length, response.indexOf("ATS KEYWORDS")).trim();
            const keywords = response.substring(response.indexOf("ATS KEYWORDS") + "ATS KEYWORDS".length).trim();

            setResult({ ats: atsResume, human: humanResume, keywords: keywords });
            setActiveTab('human');
        } catch (err) {
            setError('Failed to generate resume. Please check your input and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [formData]);

    const handleExportPDF = async () => {
        if (!result || !humanReadableRef.current) return;

        setIsExporting(true);
        setError(null);
        try {
            const doc = new jsPDF('p', 'mm', 'a4');
            const canvas = await html2canvas(humanReadableRef.current, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#0a0118', // deep-space for consistent background
            });

            // Human-readable resume as image
            const imgData = canvas.toDataURL('image/png');
            const imgProps = doc.getImageProperties(imgData);
            const pdfWidth = doc.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = -heightLeft;
                doc.addPage();
                doc.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            // ATS resume as text
            doc.addPage();
            doc.setFont('courier', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0); // Black text for ATS readability
            
            const atsText = result.ats;
            const margin = 15;
            const usableWidth = pdfWidth - (margin * 2);
            const lines = doc.splitTextToSize(atsText, usableWidth);
            doc.text(lines, margin, margin);

            doc.save('OmniStudio_Resume.pdf');
        } catch (e) {
            console.error("Error exporting PDF:", e);
            setError("Could not export PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const renderOutput = () => {
        if (!result) return null;
        switch (activeTab) {
            case 'ats':
                return <pre className="bg-deep-space/50 p-4 rounded-b-lg whitespace-pre-wrap text-sm text-dark-text font-mono border border-cyber-cyan/20">{result.ats}</pre>;
            case 'human':
                return <div ref={humanReadableRef} className="bg-deep-space/50 p-6 rounded-b-lg prose prose-invert max-w-none prose-p:text-dark-text prose-headings:text-light-text prose-headings:font-display prose-strong:text-cyber-cyan" dangerouslySetInnerHTML={{ __html: result.human.replace(/\n/g, '<br />') }}></div>;
            case 'keywords':
                return <div className="bg-deep-space/50 p-4 rounded-b-lg text-dark-text border border-cyber-cyan/20">{result.keywords}</div>;
            default: return null;
        }
    }
    
    const inputClass = "w-full bg-space-cadet/50 border border-cyber-cyan/30 rounded-md px-3 py-2 text-light-text placeholder-dark-text/70 focus:outline-none focus:ring-2 focus:ring-cyber-magenta focus:border-cyber-magenta shadow-nevel-down transition-shadow";

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <CyberPanel className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-2 text-shadow-cyber-cyan animate-flicker">RESUME DATABANK</h2>
                <p className="text-dark-text mb-6">Input operator data. AI will compile and optimize for mission success.</p>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-grow flex flex-col">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className={inputClass} required />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className={inputClass} required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className={inputClass} />
                        <input type="text" name="current_role" placeholder="Current Role" value={formData.current_role} onChange={handleChange} className={inputClass} required />
                    </div>
                    <input type="text" name="target_titles" placeholder="Target Job Title(s)" value={formData.target_titles} onChange={handleChange} className={inputClass} required />
                    <input type="text" name="skills_list" placeholder="Key Skills (comma separated)" value={formData.skills_list} onChange={handleChange} className={inputClass} />
                    <input type="text" name="ats_score" placeholder="ATS Score (Optional, e.g., 75%)" value={formData.ats_score} onChange={handleChange} className={inputClass} />
                    <textarea name="raw_resume_text_or_upload" placeholder="Paste your resume, experience, or bullet points here..." value={formData.raw_resume_text_or_upload} rows={10} className={`${inputClass} flex-grow`} required></textarea>
                    
                    <NevelButton type="submit" disabled={isLoading} fullWidth>
                        {isLoading ? 'Compiling...' : 'Generate Dossier'}
                    </NevelButton>
                </form>
            </CyberPanel>

            <CyberPanel className="flex flex-col">
                <h2 className="text-2xl font-display font-bold text-light-text mb-6">Generated Output</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading && <Loader text="GENERATING..." />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md border border-red-500">{error}</div>}
                    {result && !isLoading && (
                        <div>
                            <div className="flex justify-between items-center border-b border-cyber-cyan/30">
                                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                    <button onClick={() => setActiveTab('human')} className={`${activeTab === 'human' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-dark-text hover:text-light-text hover:border-cyber-cyan/50'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}>Human-Readable</button>
                                    <button onClick={() => setActiveTab('ats')} className={`${activeTab === 'ats' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-dark-text hover:text-light-text hover:border-cyber-cyan/50'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}>ATS-Optimized</button>
                                    <button onClick={() => setActiveTab('keywords')} className={`${activeTab === 'keywords' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-dark-text hover:text-light-text hover:border-cyber-cyan/50'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition`}>Keywords</button>
                                </nav>
                                <button
                                    onClick={handleExportPDF}
                                    disabled={isExporting}
                                    className="flex items-center gap-2 bg-space-cadet/50 border border-cyber-cyan/30 hover:bg-space-cadet text-dark-text font-semibold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:text-light-text"
                                    aria-label="Export resume as PDF"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    {isExporting ? 'Exporting...' : 'Export PDF'}
                                </button>
                            </div>
                            <div className="mt-4">{renderOutput()}</div>
                        </div>
                    )}
                    {!result && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full">
                           <p className="text-dark-text text-center font-display tracking-widest">AWAITING INPUT...</p>
                        </div>
                    )}
                </div>
            </CyberPanel>
        </div>
    );
};