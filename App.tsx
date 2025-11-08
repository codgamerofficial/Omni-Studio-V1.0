import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ResumeStudio } from './components/ResumeStudio';
import { ImageStudio } from './components/ImageStudio';
import { VideoStudio } from './components/VideoStudio';
import { InteriorStudio } from './components/InteriorStudio';
import { ClothingStudio } from './components/ClothingStudio';
import type { Studio } from './types';

const App: React.FC = () => {
  const [activeStudio, setActiveStudio] = useState<Studio>('Resume');

  const renderStudio = () => {
    switch (activeStudio) {
      case 'Resume':
        return <ResumeStudio />;
      case 'Image':
        return <ImageStudio />;
      case 'Video':
        return <VideoStudio />;
      case 'Interior':
        return <InteriorStudio />;
      case 'Clothing':
        return <ClothingStudio />;
      default:
        return <ResumeStudio />;
    }
  };

  return (
    <div className="flex h-screen bg-transparent font-sans">
      <Sidebar activeStudio={activeStudio} setActiveStudio={setActiveStudio} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div key={activeStudio} className="animate-glitchIn">
          {renderStudio()}
        </div>
      </main>
    </div>
  );
};

export default App;