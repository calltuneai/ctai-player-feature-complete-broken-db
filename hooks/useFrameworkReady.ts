import { useEffect } from 'react';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    const callFrameworkReady = () => {
      window.frameworkReady?.();
    };

    // Check if document is already fully loaded
    if (document.readyState === 'complete') {
      callFrameworkReady();
    } else {
      // Wait for the complete page load including all media elements
      window.addEventListener('load', callFrameworkReady);
      
      // Cleanup event listener
      return () => {
        window.removeEventListener('load', callFrameworkReady);
      };
    }
  }, []);
}