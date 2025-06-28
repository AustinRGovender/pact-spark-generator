
import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-highlight/prism-line-highlight.css';
import 'prismjs/plugins/line-highlight/prism-line-highlight';

interface SyntaxHighlighterProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  highlightLines?: string;
  className?: string;
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  code,
  language = 'javascript',
  showLineNumbers = true,
  highlightLines,
  className = '',
}) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language]);

  const preClassName = [
    showLineNumbers ? 'line-numbers' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="syntax-highlighter relative">
      <pre 
        className={preClassName}
        data-line={highlightLines}
        style={{ 
          margin: 0, 
          borderRadius: '0.75rem',
          background: '#2d3748',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
      >
        <code 
          ref={codeRef}
          className={`language-${language}`}
          style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {code}
        </code>
      </pre>
    </div>
  );
};
