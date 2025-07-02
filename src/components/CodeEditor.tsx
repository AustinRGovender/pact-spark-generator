
import React, { useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-light',
  readOnly = false,
  className = '',
}) => {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      parameterHints: { enabled: true },
      hover: { enabled: true },
      bracketPairColorization: { enabled: true },
    });

    // Add PactJS-specific snippets and auto-completion
    const pactSnippets = [
      {
        label: 'pact-consumer-test',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'describe("${1:Consumer} API", () => {',
          '  const provider = new Pact({',
          '    consumer: "${1:Consumer}",',
          '    provider: "${2:Provider}",',
          '    port: ${3:1234},',
          '  });',
          '',
          '  beforeAll(() => provider.setup());',
          '  afterAll(() => provider.finalize());',
          '  afterEach(() => provider.verify());',
          '',
          '  it("${4:should handle success case}", async () => {',
          '    await provider.addInteraction({',
          '      state: "${5:data exists}",',
          '      uponReceiving: "${6:a request for data}",',
          '      withRequest: {',
          '        method: "${7:GET}",',
          '        path: "${8:/api/data}",',
          '      },',
          '      willRespondWith: {',
          '        status: 200,',
          '        headers: { "Content-Type": "application/json" },',
          '        body: ${9:responseBody},',
          '      },',
          '    });',
          '',
          '    // Your test implementation here',
          '  });',
          '});'
        ].join('\n'),
        documentation: 'Create a basic Pact consumer test template'
      },
      {
        label: 'pact-provider-test',
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertText: [
          'const { Verifier } = require("@pact-foundation/pact");',
          '',
          'describe("${1:Provider} API", () => {',
          '  it("should validate the expectations of ${2:Consumer}", () => {',
          '    return new Verifier({',
          '      provider: "${1:Provider}",',
          '      providerBaseUrl: "${3:http://localhost:3000}",',
          '      pactUrls: ["${4:path/to/pacts}"],',
          '      publishVerificationResult: ${5:true},',
          '      providerVersion: "${6:1.0.0}",',
          '      consumerVersionSelectors: [{ tag: "main" }],',
          '    }).verifyProvider();',
          '  });',
          '});'
        ].join('\n'),
        documentation: 'Create a basic Pact provider test template'
      },
      {
        label: 'pact-matcher-like',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'like(${1:example})',
        documentation: 'Pact matcher for type matching'
      },
      {
        label: 'pact-matcher-eachlike',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'eachLike(${1:example}, { min: ${2:1} })',
        documentation: 'Pact matcher for array type matching'
      },
      {
        label: 'pact-matcher-term',
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: 'term({ matcher: "${1:regex}", generate: "${2:example}" })',
        documentation: 'Pact matcher for regex matching'
      }
    ];

    // Register completion provider
    monaco.languages.registerCompletionItemProvider('javascript', {
      provideCompletionItems: (model, position) => {
        const suggestions = pactSnippets.map(snippet => ({
          ...snippet,
          range: {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: position.column,
            endColumn: position.column,
          },
        }));
        return { suggestions };
      },
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && onChange) {
      onChange(value);
    }
  };

  return (
    <div className={`rounded-lg border overflow-hidden ${className}`}>
      <Editor
        height="500px"
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        loading={
          <div className="flex items-center justify-center h-[500px] bg-slate-50">
            <div className="text-slate-600">Loading editor...</div>
          </div>
        }
      />
    </div>
  );
};
