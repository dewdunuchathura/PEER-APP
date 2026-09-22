'use client';

import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Initialize app on mount
    if (typeof window !== 'undefined') {
      // Load the inline HTML/JS from the peard app
      initializePeardApp();
    }
  }, []);

  return (
    <>
      {/* This div will be populated by the peard app JavaScript */}
      <div id="peard-app-root">
        {/* Header */}
        <header className="w-full max-w-md px-5 pt-5 pb-3 sticky top-0 bg-app-bg/80 backdrop-blur-md z-30 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 bg-white border border-black/5">
                🍐
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-app-text">peard</h1>
                <p className="text-[11px] text-app-muted flex items-center gap-1 mt-0.5 font-medium">
                  📍 Speed Dating Event
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => triggerVibration([100, 50, 100])}
                className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs text-app-muted hover:text-app-pink hover:border-app-pink transition shadow-sm"
              >
                🔔
              </button>
              <button 
                onClick={() => showToast('Event Link Copied!')}
                className="w-8 h-8 rounded-full bg-app-text text-white flex items-center justify-center text-xs shadow-sm hover:opacity-90 transition"
              >
                📤
              </button>
              <button 
                onClick={openFilterModal}
                className="w-8 h-8 rounded-full bg-white border border-black/10 flex items-center justify-center text-xs text-app-muted hover:text-app-pink hover:border-app-pink transition shadow-sm"
              >
                🎚️
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full max-w-md px-5 py-4 space-y-4 flex-1">
          <div id="app-screens" className="space-y-4">
            {/* Screens will be rendered here by JavaScript */}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-30">
          <div className="w-full max-w-md mx-auto px-4 py-3 flex justify-around items-center text-center">
            <button className="flex flex-col items-center gap-1 text-xs font-bold text-app-text hover:text-app-pink transition py-2 px-3">
              📅 Events
            </button>
            <button className="flex flex-col items-center gap-1 text-xs font-bold text-app-text hover:text-app-pink transition py-2 px-3">
              📍 Location
            </button>
            <button className="flex flex-col items-center gap-1 text-xs font-bold text-app-pink transition py-2 px-3">
              ❤️ Pears
            </button>
            <button className="flex flex-col items-center gap-1 text-xs font-bold text-app-text hover:text-app-pink transition py-2 px-3">
              💬 Messages
            </button>
            <button className="flex flex-col items-center gap-1 text-xs font-bold text-app-text hover:text-app-pink transition py-2 px-3">
              👤 Profile
            </button>
          </div>
        </footer>
      </div>

      {/* Inline all the peard app JavaScript */}
      <script>{getPeardAppScript()}</script>
    </>
  );
}

// Get the peard app script (would be loaded from the HTML file)
function getPeardAppScript() {
  return `
    // Initialize all the peard app functionality
    window.goToStep = function(stepName) {
      console.log('Navigate to:', stepName);
    };
    
    window.showToast = function(message) {
      console.log('Toast:', message);
      alert(message);
    };
    
    window.triggerVibration = function(pattern) {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    };
    
    window.openFilterModal = function() {
      console.log('Open filter modal');
    };
    
    function initializePeardApp() {
      console.log('🍐 Peard App Initialized');
    }
  `;
}

function initializePeardApp() {
  console.log('🍐 Peard App Initialized');
}

function showToast(message) {
  console.log('Toast:', message);
  if (typeof window !== 'undefined') {
    alert(message);
  }
}

function triggerVibration(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

function openFilterModal() {
  console.log('Open filter modal');
}
