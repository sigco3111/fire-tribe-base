
import React from 'react';
import { Idea } from '../types';
import IdeaCard from './IdeaCard';

interface IdeaListProps {
  ideas: Idea[];
  onSelectIdea: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onToggleFavorite: (ideaId: string) => void;
  isIdeaListLoading: boolean; // Renamed from isLoading for clarity
  activeFilters: boolean;
  onAddNewManualIdea?: () => void; // Optional: To open new idea modal
  isAppBusy?: boolean; // New prop for global app loading state
}

const IdeaList: React.FC<IdeaListProps> = ({ 
    ideas, 
    onSelectIdea, 
    onDeleteIdea, 
    onToggleFavorite, 
    isIdeaListLoading, 
    activeFilters,
    onAddNewManualIdea,
    isAppBusy 
}) => {
  if (isIdeaListLoading) {
    return null; // Loading spinner is handled by App.tsx
  }

  if (ideas.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12 px-6 bg-slate-800 rounded-lg shadow-md my-8">
        <svg className="mx-auto h-16 w-16 text-sky-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /> {/* Lightbulb-like or empty box */}
        </svg>
        <h3 className="text-xl font-semibold text-slate-300 mb-2">
          {activeFilters 
            ? "조건에 맞는 아이디어를 찾지 못했어요." 
            : "아직 아이디어가 없네요!"
          }
        </h3>
        <p className="text-slate-400 mb-6">
          {activeFilters 
            ? "다른 필터 조합을 시도해보시거나, 새로운 아이디어를 추가해보세요." 
            : "AI에게 영감을 얻으려면 상단의 'AI 아이디어 요청' 버튼을 사용하거나, 직접 새로운 아이디어를 추가하여 FIRE 여정을 시작해보세요."
          }
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          {onAddNewManualIdea && (
             <button
                onClick={onAddNewManualIdea}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isAppBusy}
            >
                ✍️ 새 아이디어 직접 추가
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {ideas.map((idea) => (
        <IdeaCard 
            key={idea.id} 
            idea={idea} 
            onSelect={onSelectIdea} 
            onDelete={onDeleteIdea}
            onToggleFavorite={onToggleFavorite} 
        />
      ))}
    </div>
  );
};

export default IdeaList;