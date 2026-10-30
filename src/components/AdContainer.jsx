import React, { useEffect, useRef } from 'react';

/**
 * Monetization-Ready Ad Container for Google AdSense
 * 
 * Rules strictly followed:
 * 1. Does NOT generate fake advertisements or mockup banners.
 * 2. Remains hidden or collapsed when no live ad code is configured.
 * 3. Never obstructs core upload, compression, or download functionality.
 * 4. Ready for instant plug-and-play by adding your AdSense client ID.
 */
export default function AdContainer({ slotId, format = 'auto', className = '' }) {
  const adRef = useRef(null);

  useEffect(() => {
    // If genuine Google AdSense script is present on window, request ad fill
    try {
      if (window.adsbygoogle && typeof window.adsbygoogle.push === 'function') {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense silent handling
    }
  }, [slotId]);

  // When live ad code is not active, this container remains hidden and clean
  // (per requirement: "Do not display fake ads... Keep advertisement areas hidden until genuine approved ad code is configured")
  const isAdSenseConfigured = Boolean(window.adsbygoogle);

  if (!isAdSenseConfigured) {
    return (
      <div 
        className={`ad-container-reserved hidden print:hidden ${className}`} 
        data-ad-slot={slotId} 
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`ad-wrapper my-8 flex justify-center text-center overflow-hidden ${className}`}>
      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 block">
        Advertisement
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with approved AdSense client ID
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
