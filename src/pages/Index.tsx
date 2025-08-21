import { useState } from 'react';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import ArticlesSection from '@/components/ArticlesSection';
import ProjectsSection from '@/components/ProjectsSection';

const Index = () => {
  const [activeSection, setActiveSection] = useState('home');

  const renderSection = () => {
    switch (activeSection) {
      case 'articles':
        return <ArticlesSection />;
      case 'projects':
        return <ProjectsSection />;
      default:
        return <HeroSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection={activeSection} onSectionChange={setActiveSection} />
      <main>
        {renderSection()}
      </main>
    </div>
  );
};

export default Index;
