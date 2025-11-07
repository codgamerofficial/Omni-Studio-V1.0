
import React, { useState, useCallback } from 'react';
import { generateResume } from '../services/geminiService';

const Loader: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-brand-primary" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2 text-dark-text-secondary">Generating your perfect resume...</span>
    </div>
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
    });
    const [result, setResult] = useState<{ ats: string; human: string; keywords: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            setError('Failed to generate resume. Please check your input and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [formData]);

    return (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Input Form */}
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-4">Resume Information</h2>
                <p className="text-dark-text-secondary mb-6">Fill in your details, and our AI will craft the perfect resume for you.</p>
                <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" required />
                        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                        <input type="text" name="current_role" placeholder="Current Role" value={formData.current_role} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" required />
                    </div>
                    <input type="text" name="target_titles" placeholder="Target Job Title(s)" value={formData.target_titles} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" required />
                    <input type="text" name="skills_list" placeholder="Key Skills (comma separated)" value={formData.skills_list} onChange={handleChange} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" />
                    <textarea name="raw_resume_text_or_upload" placeholder="Paste your resume, experience, or bullet points here..." value={formData.raw_resume_text_or_upload} onChange={handleChange} rows={10} className="w-full bg-gray-800 border border-dark-border rounded-md px-3 py-2 focus:ring-brand-primary focus:border-brand-primary" required></textarea>
                    
                    <button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading ? 'Generating...' : 'Generate Resume'}
                    </button>
                </form>
            </div>

            {/* Output Display */}
            <div className="bg-dark-surface p-6 rounded-lg shadow-lg flex flex-col">
                <h2 className="text-2xl font-bold text-dark-text-primary mb-6">Generated Resume</h2>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading && <Loader />}
                    {error && <div className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</div>}
                    {result && !isLoading && (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-semibold text-brand-secondary mb-3">ATS-Optimized Version</h3>
                                <pre className="bg-gray-800 p-4 rounded-md whitespace-pre-wrap text-sm text-dark-text-secondary font-mono">{result.ats}</pre>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-brand-secondary mb-3">Human-Readable Version</h3>
                                <div className="bg-gray-800 p-4 rounded-md whitespace-pre-wrap text-dark-text-secondary" dangerouslySetInnerHTML={{ __html: result.human.replace(/\n/g, '<br />') }}></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-brand-secondary mb-3">Suggested ATS Keywords</h3>
                                <div className="bg-gray-800 p-4 rounded-md text-dark-text-secondary">{result.keywords}</div>
                            </div>
                        </div>
                    )}
                    {!result && !isLoading && !error && (
                        <div className="flex items-center justify-center h-full">
                           <p className="text-dark-text-secondary text-center">Your generated resume will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
