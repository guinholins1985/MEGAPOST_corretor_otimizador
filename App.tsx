import React, { useState, useCallback } from 'react';
import { optimizeAd } from './services/geminiService';
import type { OptimizedAdResponse } from './types';
import { SparklesIcon, CheckCircleIcon, ClipboardIcon, ClipboardCheckIcon, ImagePlaceholderIcon, LinkIcon } from './components/icons';
import Loader from './components/Loader';

// Result component updated to only show the final optimized ad
interface ResultDisplayProps {
  optimizedAd: OptimizedAdResponse;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ optimizedAd }) => {
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const handleCopy = useCallback((text: string, type: 'title' | 'desc') => {
    navigator.clipboard.writeText(text).then(() => {
      if (type === 'title') {
        setCopiedTitle(true);
        setTimeout(() => setCopiedTitle(false), 2000);
      } else {
        setCopiedDesc(true);
        setTimeout(() => setCopiedDesc(false), 2000);
      }
    });
  }, []);

  const ScoreBadge: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
    <div className="flex flex-col items-center text-center">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`mt-1 text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
  
  const getScoreColor = (score: string) => {
    switch(score.toLowerCase()) {
        case 'alto':
        case 'excelente':
            return 'text-green-400';
        case 'médio':
        case 'bom':
            return 'text-yellow-400';
        case 'baixo':
        case 'a melhorar':
            return 'text-red-400';
        default:
            return 'text-slate-200';
    }
  };

  return (
    <div className="mt-8 w-full animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-cyan-300 mb-6">Seu Anúncio Otimizado!</h2>
      
      {/* Metrics */}
      <div className="mb-8 bg-slate-800/50 p-4 rounded-lg border border-slate-700 flex justify-around">
          <ScoreBadge label="Nível de Persuasão" value={optimizedAd.persuasionScore} color={getScoreColor(optimizedAd.persuasionScore)} />
          <ScoreBadge label="Nota de Clareza" value={optimizedAd.clarityScore} color={getScoreColor(optimizedAd.clarityScore)} />
      </div>

      <div className="space-y-8">
        {/* Optimized Title */}
        <div>
           <div className="relative bg-slate-800/50 p-4 rounded-lg border border-green-500/50">
               <button 
                 onClick={() => handleCopy(optimizedAd.optimizedTitle, 'title')}
                 className="absolute top-2 right-2 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors text-slate-300 hover:text-white"
                 aria-label="Copiar título otimizado"
                >
                {copiedTitle ? <ClipboardCheckIcon className="w-4 h-4 text-green-400"/> : <ClipboardIcon className="w-4 h-4"/>}
              </button>
              <h4 className="text-sm font-semibold mb-2 text-green-400">Título Otimizado</h4>
              <p className="text-slate-200 font-medium text-lg">{optimizedAd.optimizedTitle}</p>
           </div>
        </div>

        {/* Optimized Description */}
         <div>
           <div className="relative bg-slate-800/50 p-4 rounded-lg border border-green-500/50">
               <button 
                 onClick={() => handleCopy(optimizedAd.optimizedDescription, 'desc')}
                 className="absolute top-2 right-2 p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors text-slate-300 hover:text-white"
                 aria-label="Copiar descrição otimizada"
                >
                {copiedDesc ? <ClipboardCheckIcon className="w-4 h-4 text-green-400"/> : <ClipboardIcon className="w-4 h-4"/>}
              </button>
              <h4 className="text-sm font-semibold mb-2 text-green-400">Descrição Otimizada</h4>
              <p className="text-slate-200 whitespace-pre-wrap font-medium">{optimizedAd.optimizedDescription}</p>
           </div>
        </div>
      </div>
      
      {/* Image Suggestion */}
      <div className="mt-8 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-amber-300 flex items-center gap-2">
            <ImagePlaceholderIcon className="w-5 h-5"/>
            Sugestão de Imagem
        </h3>
        <p className="text-slate-300">{optimizedAd.imageSuggestion}</p>
      </div>

      {/* Improvements / Highlights */}
      <div className="mt-8 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
        <h3 className="text-lg font-semibold mb-4 text-amber-300">Pontos de Destaque da Otimização</h3>
        <ul className="space-y-3">
          {optimizedAd.improvements.map((item, index) => (
            <li key={index} className="flex items-start">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
              <span className="text-slate-300">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

function App() {
  const [productUrl, setProductUrl] = useState('');
  const [optimizedResult, setOptimizedResult] = useState<OptimizedAdResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = useCallback(async () => {
    setError(null);
    setOptimizedResult(null);

    if (!productUrl.trim()) {
      setError("Por favor, insira a URL do produto.");
      return;
    }
    
    try {
        new URL(productUrl);
    } catch (_) {
        setError("Por favor, insira uma URL válida.");
        return;
    }

    setIsLoading(true);

    try {
      const result = await optimizeAd(productUrl);
      setOptimizedResult(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [productUrl]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 md:p-8">
      <main className="w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Header */}
        <header className="text-center my-8">
          <h2 className="text-xl font-bold tracking-[0.3em] text-slate-400 uppercase mb-4">
            MEGAPOST
          </h2>
          <div className="inline-block bg-gradient-to-r from-cyan-400 to-blue-500 p-3 rounded-full mb-4">
              <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 text-transparent bg-clip-text">
            Otimizador de Anúncios IA
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            Cole a URL do seu produto e deixe a IA criar um anúncio perfeito.
          </p>
        </header>

        {/* Input Form */}
        <div className="w-full bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700 space-y-4">
            <div className="animate-fade-in">
              <label htmlFor="product-url" className="flex items-center text-sm font-medium text-slate-300 mb-2">
                <LinkIcon className="w-5 h-5 mr-2 text-slate-500"/>
                URL do Produto no Marketplace
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                 <input
                  id="product-url"
                  name="productUrl"
                  type="url"
                  className="flex-grow w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow text-slate-200 placeholder-slate-500"
                  placeholder="https://exemplo.com/seu-produto"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleOptimize();
                    }
                  }}
                />
                <button
                  onClick={handleOptimize}
                  disabled={isLoading || !productUrl.trim()}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-5 h-5" />
                      Analisar e Otimizar
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mt-6 w-full bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg text-center animate-fade-in">
              <strong>Atenção:</strong> {error}
            </div>
        )}
        
        {/* Loading and Result Display */}
        {isLoading && optimizedResult === null && <Loader />}
        {optimizedResult && <ResultDisplay optimizedAd={optimizedResult} />}
        
        {/* Footer */}
        <footer className="mt-12 text-center text-slate-500 text-sm">
            <p>Powered by Google Gemini API</p>
        </footer>
      </main>
    </div>
  );
}

export default App;