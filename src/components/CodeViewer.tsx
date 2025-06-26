
import React from 'react';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

interface CodeViewerProps {
  test: GeneratedTest;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ test }) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(test.content);
    toast({
      title: "Copied to Clipboard",
      description: `${test.filename} has been copied to your clipboard`,
    });
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl">
      <div className="p-4 sm:p-6 border-b border-white/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
              {test.filename}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 truncate">
              {test.method} {test.endpoint} • {test.tag}
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-[#bbc7fe]/20 hover:bg-[#bbc7fe]/30 
                     text-slate-700 rounded-lg sm:rounded-xl transition-all duration-200 border border-[#bbc7fe]/30 text-xs sm:text-sm flex-shrink-0"
          >
            <Copy className="h-3 sm:h-4 w-3 sm:w-4" />
            <span>Copy</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 sm:p-6">
        <pre className="bg-slate-50/50 rounded-xl p-3 sm:p-4 overflow-x-auto text-xs sm:text-sm">
          <code className="text-slate-800 whitespace-pre-wrap">
            {test.content}
          </code>
        </pre>
      </div>
    </div>
  );
};
