import React, { useEffect, useRef } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

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
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(test.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: `Test for ${test.endpoint} copied successfully`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard",
        variant: "destructive",
      });
    }
  };

  // Simple syntax highlighting for JavaScript/TypeScript
  const highlightCode = (code: string) => {
    return code
      .replace(/(\/\/.*)/g, '<span class="text-green-600">$1</span>')
      .replace(/(describe|it|expect|pact|given|uponReceiving|withRequest|willRespondWith)\b/g, '<span class="text-purple-600 font-semibold">$1</span>')
      .replace(/(['"`])((?:(?!\1)[^\\]|\\.)*)(\1)/g, '<span class="text-blue-600">$1$2$3</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-orange-600">$1</span>')
      .replace(/\b(const|let|var|function|async|await|return|import|from|export|default)\b/g, '<span class="text-indigo-600 font-medium">$1</span>');
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50/50 to-white/50 px-6 py-4 border-b border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {test.endpoint}
            </h3>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <span className="bg-slate-200/60 px-2 py-1 rounded-md font-mono uppercase">
                {test.method}
              </span>
              <span>•</span>
              <span className="bg-[#bbc7fe]/20 px-2 py-1 rounded-md">
                {test.tag}
              </span>
              <span>•</span>
              <span className="font-mono text-xs">
                {test.filename}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-[#bbc7fe]/20 hover:bg-[#bbc7fe]/30 
                     text-slate-700 rounded-xl transition-all duration-200 border border-[#bbc7fe]/30"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative">
        <pre className="p-6 text-sm leading-relaxed overflow-x-auto bg-gradient-to-br from-slate-50/30 to-white/30">
          <code 
            ref={codeRef}
            className="text-slate-800 font-mono"
            dangerouslySetInnerHTML={{ __html: highlightCode(test.content) }}
          />
        </pre>
        
        {/* Subtle gradient overlay */}
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-white/60 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
