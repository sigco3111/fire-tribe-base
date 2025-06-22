import React, { useState, useEffect } from 'react';
import { ApiKeySource } from '../types';

// Icons
const CheckIcon = () => (
  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon = () => (
  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const EditIcon = () => (
  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const KeyIcon = () => (
    <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);


interface ApiKeyManagerProps {
  apiKey: string | null;
  apiKeySource: ApiKeySource;
  isEnvKeyPresent: boolean;
  onSaveKey: (key: string) => void;
  onClearKey: () => void;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  apiKey, 
  apiKeySource, 
  isEnvKeyPresent, 
  onSaveKey,
  onClearKey
}) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);

  useEffect(() => {
    if (apiKeySource === 'local' && apiKey) {
      setInputValue(apiKey);
    } else if (apiKeySource !== 'local') {
      // If source is env or none, input should be clear unless user starts typing
      // However, if env key is present, input is disabled anyway.
      // If none, it should be empty.
      setInputValue(''); 
    }
    // Only show input field expanded by default if no key is present at all
    setShowInput(apiKeySource === 'none' && !isEnvKeyPresent); 
  }, [apiKey, apiKeySource, isEnvKeyPresent]);

  const handleSave = () => {
    if (inputValue.trim()) {
      onSaveKey(inputValue.trim());
      if (!isEnvKeyPresent) setShowInput(false); // Hide input after save if not overridden by env
    }
  };

  const handleClear = () => {
    onClearKey();
    setInputValue('');
    if (!isEnvKeyPresent) setShowInput(true); // Show input to allow re-entry
  };
  
  const toggleInputVisibility = () => {
      if(!isEnvKeyPresent) {
          setShowInput(!showInput);
      }
  }

  let statusText = "API Key: 상태 확인 중...";
  let statusColor = "bg-yellow-700/60 text-yellow-300";
  let StatusIcon = KeyIcon;
  let titleText = "API 키 상태를 확인하고 있습니다...";

  if (isEnvKeyPresent) {
    statusText = "API Key: 환경 변수에서 로드됨";
    statusColor = "bg-green-700/60 text-green-300";
    StatusIcon = CheckIcon;
    titleText = "API 키가 환경 변수에서 성공적으로 로드되었습니다. 이 키가 사용됩니다.";
  } else {
    switch (apiKeySource) {
      case 'local':
        statusText = "API Key: 로컬 저장소에서 로드됨";
        statusColor = "bg-sky-700/60 text-sky-300";
        StatusIcon = CheckIcon;
        titleText = "API 키가 로컬 저장소(브라우저)에서 로드되었습니다.";
        break;
      case 'none':
        statusText = "API Key: 설정 필요";
        statusColor = "bg-red-700/60 text-red-300";
        StatusIcon = ErrorIcon;
        titleText = "API 키가 설정되지 않았습니다. AI 기능을 사용하려면 아래에 키를 입력하고 저장해주세요.";
        break;
      case 'checking':
      default:
        // Already set
        break;
    }
  }

  return (
    <div className="text-xs w-full sm:w-auto">
      <div 
        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer ${statusColor} ${isEnvKeyPresent ? 'opacity-80' : 'hover:opacity-90'}`}
        title={isEnvKeyPresent ? titleText : "클릭하여 API 키 입력 필드를 열거나 닫습니다."}
        onClick={toggleInputVisibility}
        role="button"
        tabIndex={isEnvKeyPresent ? -1 : 0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleInputVisibility();}}
        aria-expanded={showInput}
        aria-controls="api-key-input-section"
      >
        <div className="flex items-center">
            <StatusIcon />
            <span>{statusText}</span>
        </div>
        {!isEnvKeyPresent && (
            <EditIcon />
        )}
      </div>

      {showInput && !isEnvKeyPresent && (
        <div id="api-key-input-section" className="mt-2 p-3 bg-slate-700 rounded-md shadow-lg space-y-2">
          <p className="text-slate-300 text-xs mb-1">
            Gemini API 키를 입력해주세요. 이 키는 브라우저의 로컬 저장소에만 저장됩니다.
          </p>
          <input
            type="password" // Use password type to obscure key
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ここにAPIキーを入力"
            className="w-full p-2 bg-slate-600 border border-slate-500 rounded-md text-slate-100 placeholder-slate-400 text-xs focus:ring-1 focus:ring-sky-500"
            aria-label="API Key Input"
          />
          <div className="flex gap-2 justify-end">
            {apiKeySource === 'local' && (
              <button
                onClick={handleClear}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-xs transition-colors"
              >
                저장된 키 삭제
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!inputValue.trim()}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs transition-colors disabled:opacity-50"
            >
              API 키 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeyManager;
