
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
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <FileCode className="h-5 w-5" />
            <span className="font-semibold">
              {testsCount} test{testsCount === 1 ? '' : 's'} generated
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onCopyAll}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100/60 hover:bg-slate-200/60 
                     text-slate-700 rounded-xl transition-all duration-200 border border-slate-200/50"
          >
            <Copy className="h-4 w-4" />
            <span>Copy All</span>
          </button>
          
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-4 py-2 bg-[#bbc7fe]/20 hover:bg-[#bbc7fe]/30 
                     text-slate-700 rounded-xl transition-all duration-200 border border-[#bbc7fe]/30"
          >
            <Download className="h-4 w-4" />
            <span>Download ZIP</span>
          </button>
          
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-100/60 hover:bg-red-200/60 
                     text-red-700 rounded-xl transition-all duration-200 border border-red-200/50"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
