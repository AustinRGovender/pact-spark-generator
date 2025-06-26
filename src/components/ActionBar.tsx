
import React from 'react';
import { Copy, Download, RotateCcw, FileCode } from 'lucide-react';

interface ActionBarProps {
  testsCount: number;
  onCopyAll: () => void;
  onDownloadZip: () => void;
  onReset: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  testsCount,
  onCopyAll,
  onDownloadZip,
  onReset,
}) => {
  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 text-slate-700 w-full sm:w-auto justify-center sm:justify-start">
          <FileCode className="h-4 sm:h-5 w-4 sm:w-5" />
          <span className="font-semibold text-sm sm:text-base">
            {testsCount} test{testsCount === 1 ? '' : 's'} generated
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={onCopyAll}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100/60 hover:bg-slate-200/60 
                     text-slate-700 rounded-lg sm:rounded-xl transition-all duration-200 border border-slate-200/50 text-xs sm:text-sm"
          >
            <Copy className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="hidden sm:inline">Copy All</span>
            <span className="sm:hidden">Copy</span>
          </button>
          
          <button
            onClick={onDownloadZip}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#bbc7fe]/20 hover:bg-[#bbc7fe]/30 
                     text-slate-700 rounded-lg sm:rounded-xl transition-all duration-200 border border-[#bbc7fe]/30 text-xs sm:text-sm"
          >
            <Download className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="hidden sm:inline">Download ZIP</span>
            <span className="sm:hidden">ZIP</span>
          </button>
          
          <button
            onClick={onReset}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-red-100/60 hover:bg-red-200/60 
                     text-red-700 rounded-lg sm:rounded-xl transition-all duration-200 border border-red-200/50 text-xs sm:text-sm"
          >
            <RotateCcw className="h-3 sm:h-4 w-3 sm:w-4" />
            <span className="hidden sm:inline">Reset</span>
            <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
