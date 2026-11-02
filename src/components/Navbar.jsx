import React, { useState } from 'react';
import { 
  FileDown, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Zap 
} from 'lucide-react';

export default function Navbar({ 
  currentPage = 'home', 
  setCurrentPage, 
  navigateTo: externalNavigate,
  darkMode, 
  setDarkMode, 
  onOpenContact 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (page, sectionId = null) => {
    setMobileMenuOpen(false);
    if (externalNavigate) {
      externalNavigate(page, sectionId);
      return;
    }
    if (page === 'contact' && onOpenContact) {
      onOpenContact();
      return;
    }
    if (setCurrentPage) {
      setCurrentPage(page);
    }
    if (page === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <button 
          onClick={() => navigateTo('home', 'upload-section')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
          aria-label="CompressPDF Home"
        >
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <FileDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
              Compress<span className="text-indigo-600 dark:text-indigo-400">PDF</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 -mt-1">
              Client-Side Fast
            </span>
          </div>
        </button>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button 
            onClick={() => navigateTo('home', 'upload-section')} 
            className={`transition hover:text-indigo-600 dark:hover:text-indigo-400 ${
              currentPage === 'home' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            Compress
          </button>
          <button 
            onClick={() => navigateTo('about')} 
            className={`transition hover:text-indigo-600 dark:hover:text-indigo-400 ${
              currentPage === 'about' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            About Us
          </button>
          <button 
            onClick={() => navigateTo('how-it-works')} 
            className={`transition hover:text-indigo-600 dark:hover:text-indigo-400 ${
              currentPage === 'how-it-works' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            How It Works
          </button>
          <button 
            onClick={() => navigateTo('home', 'features')} 
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            Features
          </button>
          <button 
            onClick={() => navigateTo('home', 'faq')} 
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            FAQ
          </button>
          <button 
            onClick={() => navigateTo('contact')} 
            className={`transition hover:text-indigo-600 dark:hover:text-indigo-400 ${
              currentPage === 'contact' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Upload PDF CTA */}
          <button
            onClick={() => navigateTo('home', 'upload-section')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-500/30 transition hover:shadow-indigo-500/50"
          >
            <Zap className="w-4 h-4" />
            <span>Upload PDF</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pt-3 pb-6 space-y-2 animate-fade-in text-left">
          <button
            onClick={() => navigateTo('home', 'upload-section')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Compress PDF
          </button>
          <button
            onClick={() => navigateTo('about')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            About Us
          </button>
          <button
            onClick={() => navigateTo('how-it-works')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            How It Works
          </button>
          <button
            onClick={() => navigateTo('home', 'features')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Features
          </button>
          <button
            onClick={() => navigateTo('home', 'faq')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            FAQ
          </button>
          <button
            onClick={() => navigateTo('contact')}
            className="w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Contact
          </button>
          <div className="pt-2">
            <button
              onClick={() => navigateTo('home', 'upload-section')}
              className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow"
            >
              Start Compressing
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
