import React, { useState, useEffect } from 'react';
import type { Studio } from '../types';
import { ResumeIcon, ImageIcon, VideoIcon, InteriorIcon, ClothingIcon, AppLogo, ChevronDoubleLeftIcon } from './icons';

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
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
        const item = window.localStorage.getItem('sidebarExpanded');
        return item ? JSON.parse(item) : true;
    } catch (error) {
        console.error("Could not parse sidebarExpanded from localStorage", error);
        return true;
    }
  });

  useEffect(() => {
    try {
        window.localStorage.setItem('sidebarExpanded', JSON.stringify(isExpanded));
    } catch (error) {
        console.error("Could not set sidebarExpanded in localStorage", error);
    }
  }, [isExpanded]);

  const NavItem: React.FC<{
    studio: typeof studioOptions[0];
    isActive: boolean;
    onClick: () => void;
  }> = ({ studio, isActive, onClick }) => (
    <div className="relative group">
        <button
          onClick={onClick}
          className={`relative flex items-center w-full h-14 text-sm font-medium rounded-lg transition-all duration-300 ease-in-out overflow-hidden group
          ${ isExpanded ? 'px-3' : 'justify-center' }
          ${ isActive
              ? 'text-cyber-cyan bg-space-cadet/80'
              : 'text-dark-text hover:bg-space-cadet/50 hover:text-light-text'
          }
          ${ !isExpanded && isActive ? 'bg-cyber-cyan/20 shadow-cyber-glow-cyan' : '' }
          `}
          aria-current={isActive ? 'page' : undefined}
        >
            {/* Active indicator bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-cyber-cyan rounded-r-full shadow-cyber-glow-cyan transition-all duration-300 origin-center
              ${isActive ? 'scale-y-100' : 'scale-y-0'}
            `}></div>
            
            <studio.icon className={`w-7 h-7 transition-all duration-300 z-10 
              ${isExpanded ? 'ml-4 mr-4' : ''}
              ${isActive ? 'scale-100' : 'group-hover:scale-110'}
            `} />
  
            <span className={`whitespace-nowrap transition-all duration-300 ease-in-out z-10
              ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute'}`}>
              {studio.name}
            </span>
        </button>
        {/* Tooltip for collapsed state */}
        {!isExpanded && (
            <div className="absolute left-full ml-4 px-3 py-1.5 bg-space-cadet/50 backdrop-blur-md border border-cyber-cyan/30 text-light-text text-xs font-semibold rounded-md shadow-lg 
              opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 
              transition-all duration-300 ease-out pointer-events-none group-hover:delay-500 
              invisible group-hover:visible z-50">
                {studio.name}
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-space-cadet/50 transform rotate-45 border-b border-l border-cyber-cyan/30"></div>
            </div>
        )}
    </div>
  );

  return (
    <aside className={`flex flex-col bg-deep-space/30 backdrop-blur-xl border-r border-cyber-cyan/20 text-light-text transition-all duration-300 ease-in-out shadow-lg shadow-cyber-magenta/10 ${isExpanded ? 'w-64' : 'w-20'}`}>
      <div className={`flex items-center h-24 border-b border-cyber-cyan/20 transition-all duration-300 ${isExpanded ? 'px-4' : 'px-0 justify-center'}`}>
         <div className={`group flex items-center overflow-hidden cursor-pointer`}>
            <AppLogo className={`transition-all duration-500 ease-out flex-shrink-0 group-hover:-rotate-12 group-hover:scale-110 ${isExpanded ? 'w-12 h-12' : 'w-10 h-10'}`} />
            <h1 className={`ml-3 text-2xl font-display font-bold whitespace-nowrap transition-all duration-300 text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-magenta animate-flicker ${isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                OMNI
            </h1>
         </div>
      </div>
      <nav className="flex-grow p-2 space-y-2 mt-4">
        {studioOptions.map((studio) => (
          <NavItem
            key={studio.id}
            studio={studio}
            isActive={activeStudio === studio.id}
            onClick={() => setActiveStudio(studio.id)}
          />
        ))}
      </nav>
      <div className="mt-auto border-t border-cyber-cyan/20 p-2">
        <div className="flex justify-center">
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="p-3 my-1 rounded-lg hover:bg-space-cadet/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyber-cyan text-cyber-cyan transition-all duration-300 hover:shadow-cyber-glow-cyan w-full"
              aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
               <ChevronDoubleLeftIcon className={`w-6 h-6 mx-auto transition-transform duration-500 ease-in-out ${!isExpanded && 'rotate-180'}`} />
            </button>
        </div>
        
        <div className={`transition-all duration-300 ease-in-out overflow-hidden text-center ${isExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="text-xs text-dark-text/70 pt-2 border-t border-cyber-cyan/10 mt-1">
                Omni Studio AI &copy; 2024
            </div>
        </div>
      </div>
    </aside>
  );
};
