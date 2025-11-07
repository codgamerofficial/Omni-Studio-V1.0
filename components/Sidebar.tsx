
import React, { useState } from 'react';
import type { Studio } from '../types';
import { ResumeIcon, ImageIcon, VideoIcon, InteriorIcon, ClothingIcon, SparklesIcon } from './icons';

interface SidebarProps {
  activeStudio: Studio;
  setActiveStudio: (studio: Studio) => void;
}

const studioOptions: { id: Studio; name: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Resume', name: 'Resume Builder', icon: ResumeIcon },
  { id: 'Image', name: 'Image Studio', icon: ImageIcon },
  { id: 'Video', name: 'Video Studio', icon: VideoIcon },
  { id: 'Interior', name: 'Interior Designer', icon: InteriorIcon },
  { id: 'Clothing', name: 'Fashion Designer', icon: ClothingIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeStudio, setActiveStudio }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const NavItem: React.FC<{
    studio: typeof studioOptions[0];
    isActive: boolean;
    onClick: () => void;
  }> = ({ studio, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-brand-primary text-white'
          : 'text-dark-text-secondary hover:bg-dark-surface hover:text-dark-text-primary'
      }`}
    >
      <studio.icon className="w-6 h-6 mr-3" />
      <span className={`${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>{studio.name}</span>
    </button>
  );

  return (
    <aside className={`flex flex-col bg-dark-surface text-dark-text-primary transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className="flex items-center justify-between h-16 px-4 border-b border-dark-border">
         <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-brand-secondary" />
            <h1 className={`ml-2 text-xl font-bold ${!isExpanded && 'hidden'}`}>Omni Studio</h1>
         </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 rounded-md hover:bg-dark-border focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isExpanded ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
        </button>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {studioOptions.map((studio) => (
          <NavItem
            key={studio.id}
            studio={studio}
            isActive={activeStudio === studio.id}
            onClick={() => setActiveStudio(studio.id)}
          />
        ))}
      </nav>
    </aside>
  );
};
