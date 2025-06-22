
import React from 'react';
import { IdeaCategory, ImpactLevel, EffortLevel, SortOption, ProgressStatus } from '../types';
import { 
    SORT_OPTION_LABELS, 
    FILTER_CATEGORY_OPTIONS, 
    FILTER_IMPACT_OPTIONS, 
    FILTER_EFFORT_OPTIONS,
    FILTER_STATUS_OPTIONS, // Added
    ALL_CATEGORIES,
    ALL_IMPACT_LEVELS,
    ALL_EFFORT_LEVELS,
    ALL_STATUSES // Added
} from '../constants';

interface FilterSortControlsProps {
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  filterImpact: string;
  setFilterImpact: (value: string) => void;
  filterEffort: string;
  setFilterEffort: (value: string) => void;
  filterStatus: string; // Added
  setFilterStatus: (value: string) => void; // Added
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (value: boolean) => void;
  sortOption: SortOption;
  setSortOption: (value: SortOption) => void;
  hasIdeas: boolean;
}

const FilterSortControls: React.FC<FilterSortControlsProps> = ({
  filterCategory, setFilterCategory,
  filterImpact, setFilterImpact,
  filterEffort, setFilterEffort,
  filterStatus, setFilterStatus, // Added
  showFavoritesOnly, setShowFavoritesOnly,
  sortOption, setSortOption,
  hasIdeas
}) => {
  if (!hasIdeas && !showFavoritesOnly && 
      filterCategory === ALL_CATEGORIES && 
      filterImpact === ALL_IMPACT_LEVELS && 
      filterEffort === ALL_EFFORT_LEVELS &&
      filterStatus === ALL_STATUSES // Added condition
     ) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow-md my-6 space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-end">
      {/* Filters */}
      <div className="flex-grow min-w-[150px]">
        <label htmlFor="filterCategory" className="block text-sm font-medium text-sky-300 mb-1">카테고리</label>
        <select
          id="filterCategory"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          {Object.entries(FILTER_CATEGORY_OPTIONS).map(([key, label]) => (
            // key is "ALL_CATEGORIES" or an enum key like "INCOME_GENERATION"
            // label is "모든 카테고리" or an enum value like "수입 증대"
            // The value of the option should be what is stored in filterCategory state.
            // If filterCategory state stores "수입 증대", then the option value should be "수입 증대".
            <option key={key} value={key === ALL_CATEGORIES ? ALL_CATEGORIES : label}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex-grow min-w-[150px]">
        <label htmlFor="filterImpact" className="block text-sm font-medium text-sky-300 mb-1">잠재적 효과</label>
        <select
          id="filterImpact"
          value={filterImpact}
          onChange={(e) => setFilterImpact(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          {Object.entries(FILTER_IMPACT_OPTIONS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex-grow min-w-[150px]">
        <label htmlFor="filterEffort" className="block text-sm font-medium text-sky-300 mb-1">필요 노력</label>
        <select
          id="filterEffort"
          value={filterEffort}
          onChange={(e) => setFilterEffort(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          {Object.entries(FILTER_EFFORT_OPTIONS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="flex-grow min-w-[150px]"> {/* New Filter for Status */}
        <label htmlFor="filterStatus" className="block text-sm font-medium text-sky-300 mb-1">진행 상태</label>
        <select
          id="filterStatus"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          {Object.entries(FILTER_STATUS_OPTIONS).map(([key, label]) => {
            // For ALL_STATUSES, the key is "ALL_STATUSES" and label is "모든 진행 상태"
            // For actual statuses, key is e.g., "Not Started" (from ProgressStatus enum) and label is its Korean translation
            // The value of the option should be the key itself (which matches ProgressStatus enum values or ALL_STATUSES)
             return <option key={key} value={key === "ALL_STATUSES" ? ALL_STATUSES : key as ProgressStatus}>{label}</option>;
          })}
        </select>
      </div>
      
      {/* Sort */}
      <div className="flex-grow min-w-[200px]">
        <label htmlFor="sortOption" className="block text-sm font-medium text-sky-300 mb-1">정렬 기준</label>
        <select
          id="sortOption"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value as SortOption)}
          className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-sky-500 focus:border-sky-500 text-sm"
        >
          {Object.entries(SORT_OPTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      
      {/* Favorites Toggle */}
      <div className="flex items-center pt-2 md:pt-0 md:self-end md:pb-[9px]"> {/* Align with select bottom padding and border */}
        <input
          type="checkbox"
          id="showFavoritesOnly"
          checked={showFavoritesOnly}
          onChange={(e) => setShowFavoritesOnly(e.target.checked)}
          className="h-5 w-5 text-sky-600 border-slate-500 rounded focus:ring-sky-500 bg-slate-700"
        />
        <label htmlFor="showFavoritesOnly" className="ml-2 text-sm font-medium text-slate-200 select-none">
          즐겨찾기만 보기 ★
        </label>
      </div>
    </div>
  );
};

export default FilterSortControls;