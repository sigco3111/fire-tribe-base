
import React from 'react';
import { Idea, IdeaCategory, ImpactLevel, EffortLevel, ProgressStatus } from '../types';
import { PROGRESS_STATUS_LABELS } from '../constants';

interface IdeaCardProps {
  idea: Idea;
  onSelect: (idea: Idea) => void;
  onDelete: (ideaId: string) => void;
  onToggleFavorite: (ideaId: string) => void;
}

const getCategoryColor = (category: IdeaCategory): string => {
  switch (category) {
    case IdeaCategory.INCOME_GENERATION: return "bg-green-500 hover:bg-green-600";
    case IdeaCategory.EXPENSE_REDUCTION: return "bg-blue-500 hover:bg-blue-600";
    case IdeaCategory.INVESTMENT: return "bg-purple-500 hover:bg-purple-600";
    default: return "bg-slate-500 hover:bg-slate-600";
  }
};

const getImpactColor = (level: ImpactLevel): string => {
  switch(level) {
    case ImpactLevel.HIGH: return "text-red-400";
    case ImpactLevel.MEDIUM: return "text-yellow-400";
    case ImpactLevel.LOW: return "text-green-400";
    default: return "text-slate-400";
  }
}

const getEffortColor = (level: EffortLevel): string => {
   switch(level) {
    case EffortLevel.HIGH: return "text-red-400";
    case EffortLevel.MEDIUM: return "text-yellow-400";
    case EffortLevel.LOW: return "text-green-400";
    default: return "text-slate-400";
  }
}

const getStatusColor = (status: ProgressStatus): string => {
    switch(status) {
        case ProgressStatus.NOT_STARTED: return "bg-slate-600 text-slate-300";
        case ProgressStatus.IN_PROGRESS: return "bg-sky-600 text-sky-200";
        case ProgressStatus.COMPLETED: return "bg-emerald-600 text-emerald-200";
        case ProgressStatus.ON_HOLD: return "bg-amber-600 text-amber-200";
        default: return "bg-gray-500 text-gray-100";
    }
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onSelect, onDelete, onToggleFavorite }) => {
  const ideaStatus = idea.status || ProgressStatus.NOT_STARTED; 
  const ideaTags = idea.tags || [];

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-sky-500/30 hover:scale-[1.02] flex flex-col justify-between">
      <div> {/* This div wraps content and image, image will be outside p-5 for full width potentially */}
        {idea.imageUrl && (
          <div className="w-full h-40 overflow-hidden">
            <img 
              src={idea.imageUrl} 
              alt={idea.imagePrompt || `Visual for ${idea.title}`} 
              className="w-full h-full object-cover" 
            />
          </div>
        )}
        <div className="p-5 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-semibold text-sky-400 leading-tight mr-2 flex-1">{idea.title}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea.id); }}
              className={`text-2xl p-1 rounded-full hover:bg-slate-700 transition-colors ${idea.isFavorite ? 'text-yellow-400' : 'text-slate-500'}`}
              aria-label={idea.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
              title={idea.isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            >
              {idea.isFavorite ? '★' : '☆'}
            </button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2 items-center">
              <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${getCategoryColor(idea.category)}`}>
                  {idea.category}
              </span>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(ideaStatus)}`}>
                  {PROGRESS_STATUS_LABELS[ideaStatus]}
              </span>
              {idea.isCustom ? (
                  <span className="px-2 py-0.5 bg-sky-700 text-sky-300 text-xs rounded-full">직접 추가</span>
              ) : (
                  <span className="px-2 py-0.5 bg-teal-700 text-teal-300 text-xs rounded-full">AI 제안</span>
              )}
          </div>
          <p className="text-slate-300 text-sm mb-3 flex-grow">{idea.description}</p>
          
          {ideaTags.length > 0 && (
              <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                      {ideaTags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-slate-600 text-slate-300 text-xs rounded-full">
                              #{tag}
                          </span>
                      ))}
                  </div>
              </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs my-3">
              <div className="bg-slate-700 p-2 rounded">
                  <span className="font-medium text-slate-400">잠재적 효과: </span>
                  <span className={getImpactColor(idea.potentialImpact)}>{idea.potentialImpact}</span>
              </div>
              <div className="bg-slate-700 p-2 rounded">
                  <span className="font-medium text-slate-400">필요 노력: </span>
                  <span className={getEffortColor(idea.effortLevel)}>{idea.effortLevel}</span>
              </div>
          </div>

          <div className="text-xs text-slate-500 mt-auto pt-2">
            생성일: {new Date(idea.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
       <div className="bg-slate-700/50 px-5 py-3 flex justify-between items-center">
          <button
            onClick={() => onSelect(idea)}
            className="text-sm bg-sky-600 hover:bg-sky-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            자세히 보기 & 구체화
          </button>
           <button
            onClick={(e) => { e.stopPropagation(); onDelete(idea.id); }}
            className="text-sm text-red-400 hover:text-red-300 font-medium py-2 px-3 rounded-lg transition-colors duration-200"
            aria-label="아이디어 삭제"
          >
            삭제
          </button>
        </div>
    </div>
  );
};

export default IdeaCard;