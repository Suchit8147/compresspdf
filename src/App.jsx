import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroUpload from './components/HeroUpload';
import FileConfigCard from './components/FileConfigCard';
import ResultCard from './components/ResultCard';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import CompressionGuide from './components/CompressionGuide';
import PrivacySection from './components/PrivacySection';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import AdContainer from './components/AdContainer';
import PrivacyModal from './components/Modals/PrivacyModal';
import TermsModal from './components/Modals/TermsModal';
import ContactModal from './components/Modals/ContactModal';

// Dedicated Pages
import AboutUsPage from './pages/AboutUsPage';
import HowItWorksPage from './pages/HowItWorksPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';

import { 
  getPdfInfo, 
  renderPdfPageToDataUrl, 
  compressPdf 
} from './utils/pdfCompressor';

const parsePageFromLocation = () => {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const hash = window.location.hash.replace(/^#+/, '').toLowerCase();

  if (path === 'about' || hash === 'about') return 'about';
  if (path === 'how-it-works' || hash === 'how-it-works') return 'how-it-works';
  if (path === 'privacy' || hash === 'privacy') return 'privacy';
  if (path === 'terms' || hash === 'terms') return 'terms';
  if (path === 'contact' || hash === 'contact') return 'contact';
  return 'home';
};

export default function App() {
  // Navigation Page state
  const [currentPage, setCurrentPage] = useState(() => parsePageFromLocation());

  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('compresspdf_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modals (quick overlays)
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // File & Compression state
  const [file, setFile] = useState(null);
  const [fileArrayBuffer, setFileArrayBuffer] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [error, setError] = useState('');

  const [compressionOptions, setCompressionOptions] = useState({
    level: 'high_quality',
    targetSizeKb: null,
    enhanceAi: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, stage: '' });
  const [result, setResult] = useState(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('compresspdf_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('compresspdf_theme', 'light');
    }
  }, [darkMode]);

  // Handle URL location changes (back/forward and hash changes)
  useEffect(() => {
    const handleLocationChange = () => {
      const page = parsePageFromLocation();
      setCurrentPage(page);
      const hash = window.location.hash.replace(/^#+/, '');
      if (page === 'home' && hash) {
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Update SEO Document Title on page change
  useEffect(() => {
    const titles = {
      'home': 'Compress PDF Online – Free PDF Size Reducer | CompressPDF',
      'about': 'About Us – 100% Client-Side PDF Tools | CompressPDF',
      'how-it-works': 'How It Works – Real-Time PDF Compression Guide | CompressPDF',
      'privacy': 'Privacy Policy – 100% Client-Side Privacy Guarantee | CompressPDF',
      'terms': 'Terms of Service | CompressPDF',
      'contact': 'Contact & Support – CompressPDF | businesswithsuchit@gmail.com'
    };
    document.title = titles[currentPage] || titles.home;
  }, [currentPage]);

  // Seamless navigation handler
  const navigateTo = (page, sectionId = null) => {
    setCurrentPage(page);
    const targetPath = page === 'home' ? (sectionId ? `/#${sectionId}` : '/') : `/${page}`;
    window.history.pushState({ page, sectionId }, '', targetPath);

    if (page === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle file selection from drag/drop or browse
  const handleFileSelected = async (selectedFile) => {
    try {
      setError('');
      setResult(null);
      setIsProcessing(false);
      setThumbnailUrl(null);

      if (!selectedFile) return;
      setFile(selectedFile);

      // Read file buffer
      const buffer = await selectedFile.arrayBuffer();
      if (!buffer || buffer.byteLength === 0) {
        throw new Error('The uploaded file is empty (0 bytes).');
      }
      setFileArrayBuffer(buffer);

      // Inspect PDF
      const info = await getPdfInfo(buffer);
      if (info.isEncrypted) {
        setError('This PDF is password-protected or encrypted. Please unlock it before compressing.');
        setFile(null);
        setFileArrayBuffer(null);
        return;
      }
      setFileInfo(info);

      // Render thumbnail of page 1 (non-blocking)
      try {
        const thumb = await renderPdfPageToDataUrl(buffer, 1, 0.45);
        if (thumb?.dataUrl) {
          setThumbnailUrl(thumb.dataUrl);
        }
      } catch (thumbErr) {
        console.warn('Page 1 thumbnail preview could not be generated:', thumbErr);
      }
    } catch (err) {
      console.error('File load error:', err);
      const userMessage = err?.message || 'Could not process this PDF file. It may be corrupted or in an unsupported format.';
      setError(userMessage);
      setFile(null);
      setFileArrayBuffer(null);
    }
  };

  // Run Compression
  const handleCompress = async () => {
    if (!fileArrayBuffer) return;

    try {
      setIsProcessing(true);
      setError('');
      setProgress({ percent: 5, stage: 'Initializing compression...' });

      const compressionResult = await compressPdf(
        fileArrayBuffer,
        compressionOptions,
        (p) => setProgress(p)
      );

      setResult(compressionResult);
    } catch (err) {
      console.error('Compression error:', err);
      setError(err.message || 'An error occurred while compressing your PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to upload another file
  const handleReset = () => {
    setFile(null);
    setFileArrayBuffer(null);
    setFileInfo(null);
    setThumbnailUrl(null);
    setResult(null);
    setIsProcessing(false);
    setProgress({ percent: 0, stage: '' });
    setError('');

    // Smooth scroll back to upload section
    const el = document.getElementById('upload-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* Navigation bar */}
      <Navbar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        navigateTo={navigateTo}
        darkMode={darkMode} 
        setDarkMode={setDarkMode}
        onOpenContact={() => navigateTo('contact')}
      />

      <main className="flex-1">
        {/* Render Dedicated Page or Home Tool View */}
        {currentPage === 'about' && (
          <AboutUsPage 
            onNavigateHome={() => navigateTo('home', 'upload-section')} 
            onOpenContact={() => navigateTo('contact')}
          />
        )}

        {currentPage === 'how-it-works' && (
          <HowItWorksPage 
            onNavigateHome={() => navigateTo('home', 'upload-section')} 
          />
        )}

        {currentPage === 'privacy' && (
          <PrivacyPolicyPage 
            onNavigateHome={() => navigateTo('home', 'upload-section')} 
            onOpenContact={() => navigateTo('contact')}
          />
        )}

        {currentPage === 'terms' && (
          <TermsPage 
            onNavigateHome={() => navigateTo('home', 'upload-section')} 
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage 
            onNavigateHome={() => navigateTo('home', 'upload-section')} 
          />
        )}

        {currentPage === 'home' && (
          <>
            {/* Hero Section or Active File Workflow */}
            {!file ? (
              <HeroUpload 
                onFileSelected={handleFileSelected} 
                error={error} 
                setError={setError} 
              />
            ) : result ? (
              <div className="py-12 md:py-20">
                <ResultCard
                  result={result}
                  originalFile={file}
                  originalThumbnail={thumbnailUrl}
                  onReset={handleReset}
                />
              </div>
            ) : (
              <div className="py-12 md:py-20">
                <FileConfigCard
                  file={file}
                  fileInfo={fileInfo}
                  thumbnailUrl={thumbnailUrl}
                  compressionOptions={compressionOptions}
                  setCompressionOptions={setCompressionOptions}
                  onCompress={handleCompress}
                  onReset={handleReset}
                  isProcessing={isProcessing}
                  progress={progress}
                />
              </div>
            )}

            {/* Reserved Ad Container 1: Below Hero */}
            <div className="max-w-5xl mx-auto px-4">
              <AdContainer slotId="hero-bottom-slot" format="horizontal" />
            </div>

            {/* How It Works Section */}
            <HowItWorks />

            {/* Reserved Ad Container 2: Mid-Content */}
            <div className="max-w-5xl mx-auto px-4">
              <AdContainer slotId="mid-content-slot" format="rectangle" />
            </div>

            {/* Features Section */}
            <Features />

            {/* Compression Level Guide & Comparison Table */}
            <CompressionGuide />

            {/* Privacy & Security Deep-Dive */}
            <PrivacySection />

            {/* FAQ Accordion */}
            <FAQ />

            {/* Reserved Ad Container 3: Bottom before Footer */}
            <div className="max-w-5xl mx-auto px-4">
              <AdContainer slotId="bottom-slot" format="horizontal" />
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer 
        navigateTo={navigateTo}
        onOpenPrivacy={() => navigateTo('privacy')}
        onOpenTerms={() => navigateTo('terms')}
        onOpenContact={() => navigateTo('contact')}
      />

      {/* Modals for Quick Overlays if triggered */}
      <PrivacyModal 
        isOpen={privacyOpen} 
        onClose={() => setPrivacyOpen(false)} 
      />
      <TermsModal 
        isOpen={termsOpen} 
        onClose={() => setTermsOpen(false)} 
      />
      <ContactModal 
        isOpen={contactOpen} 
        onClose={() => setContactOpen(false)} 
      />

    </div>
  );
}
