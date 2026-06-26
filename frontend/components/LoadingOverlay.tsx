"use client";

import { useState, useEffect } from 'react';

export default function LoadingOverlay() {
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleStart = () => {
      clearTimeout(timeout);
      setIsLoading(true);
      setVisible(true);
    };

    const handleStop = () => {
      setIsLoading(false);
      // Aguarda o fim da animação de opacidade para de fato remover do DOM
      timeout = setTimeout(() => {
        setVisible(false);
      }, 500); // 500ms é o tempo da nossa transition-opacity
    };

    window.addEventListener('dashboard-loading-start', handleStart);
    window.addEventListener('dashboard-loading-stop', handleStop);

    return () => {
      window.removeEventListener('dashboard-loading-start', handleStart);
      window.removeEventListener('dashboard-loading-stop', handleStop);
      clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm transition-opacity duration-500 ${
        isLoading ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center bg-slate-900/80 p-8 rounded-3xl border border-slate-700/50 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 border-4 border-t-indigo-500 border-r-rose-500 border-b-amber-500 border-l-teal-500 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-slate-800 rounded-full"></div>
        </div>
        <h3 className="text-xl font-bold text-white tracking-wide">SIEST</h3>
        <p className="text-sm text-slate-400 mt-2 font-medium tracking-widest uppercase animate-pulse">Sincronizando Dados...</p>
      </div>
    </div>
  );
}
