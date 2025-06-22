import React from 'react';
import { APP_TITLE, APP_SUBTITLE } from '../constants';
// ApiKeyManager import removed

interface HeaderProps {
  onAddNewIdea: () => void;
  onTriggerAIQuery: () => void;
  isAppBusy?: boolean;
  // ApiKeyManager related props removed
}

const Header: React.FC<HeaderProps> = ({ 
  onAddNewIdea, 
  onTriggerAIQuery, 
  isAppBusy, 
  // ApiKeyManager related props removed
}) => {
  // Logic related to aiFeaturesDisabled based on apiKeySource removed as apiKey is no longer direct prop
  // This will be handled by App.tsx, or individual buttons can check the global state if needed more granularly.
  // For simplicity, we assume App.tsx will disable buttons passed to header if API key is missing.

  return (
    <header className="bg-slate-900/80 backdrop-blur-md shadow-lg p-5 sticky top-0 z-40">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
            🔥 {APP_TITLE}
          </h1>
          <p className="text-sm text-slate-400">{APP_SUBTITLE}</p>
        </div>
        <div className="flex flex-col items-center sm:items-end gap-3 w-full sm:w-auto">
          {/* ApiKeyManager component removed from here */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={onTriggerAIQuery}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              disabled={isAppBusy} // Simplified disabled logic, App.tsx can pass a more specific disabled state for this button
              title={isAppBusy ? "처리 중..." : "AI에게 아이디어 요청"} // Simplified title
            >
              🚀 AI 아이디어 요청
            </button>
            <button
              onClick={onAddNewIdea}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              disabled={isAppBusy}
            >
              + 새 아이디어 직접 추가
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;