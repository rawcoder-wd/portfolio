import React, { useState, useEffect } from 'react';
import { Menu, X, Download, Code2, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  cvFilename?: string;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenLogin }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTo = (id: string) => {
    setIsOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadCV = () => {
    window.open('/api/cv/download', '_blank');
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div
            onClick={() => handleScrollTo('hero')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Code2 className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Portfolio
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleScrollTo('about')}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              About
            </button>
            <button
              onClick={() => handleScrollTo('skills')}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              Skills
            </button>
            <button
              onClick={() => handleScrollTo('portfolio')}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              Projects
            </button>
            <button
              onClick={() => handleScrollTo('booking')}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              Consultation
            </button>
            <button
              onClick={() => handleScrollTo('contact')}
              className="text-slate-300 hover:text-cyan-400 font-medium transition-colors"
            >
              Contact
            </button>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={handleDownloadCV}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-medium text-sm transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Resume</span>
            </button>

            <button
              onClick={onOpenLogin}
              title="Admin Control Panel"
              className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 border border-slate-800 transition-colors"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-3">
            <button
              onClick={onOpenLogin}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-cyan-400"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <button
            onClick={() => handleScrollTo('about')}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 font-medium"
          >
            About
          </button>
          <button
            onClick={() => handleScrollTo('skills')}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 font-medium"
          >
            Skills
          </button>
          <button
            onClick={() => handleScrollTo('portfolio')}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 font-medium"
          >
            Projects
          </button>
          <button
            onClick={() => handleScrollTo('booking')}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 font-medium"
          >
            Consultation
          </button>
          <button
            onClick={() => handleScrollTo('contact')}
            className="block w-full text-left px-3 py-2 rounded-md text-slate-300 hover:bg-slate-800 font-medium"
          >
            Contact
          </button>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleDownloadCV}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm w-full justify-center"
            >
              <Download className="w-4 h-4" />
              <span>Download CV</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
