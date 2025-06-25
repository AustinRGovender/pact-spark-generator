
import JSZip from 'jszip';

interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

export const downloadZip = async (tests: GeneratedTest[]): Promise<void> => {
  const zip = new JSZip();
  
  // Group tests by tag
  const testsByTag: { [tag: string]: GeneratedTest[] } = {};
  tests.forEach(test => {
    if (!testsByTag[test.tag]) {
      testsByTag[test.tag] = [];
    }
    testsByTag[test.tag].push(test);
  });
  
  // Create folders and files
  Object.entries(testsByTag).forEach(([tag, tagTests]) => {
    const folder = zip.folder(tag === 'default' ? 'tests' : `tests/${tag}`);
    
    tagTests.forEach(test => {
      folder?.file(test.filename, test.content);
    });
  });
  
  // Add package.json with Pact dependencies
  const packageJson = {
    name: 'pact-consumer-tests',
    version: '1.0.0',
    description: 'Generated PactJS consumer tests',
    scripts: {
      test: 'jest',
      'test:pact': 'jest --testPathPattern=pact',
    },
    devDependencies: {
      '@pact-foundation/pact': '^15.0.1',
      jest: '^29.0.0',
      '@types/jest': '^29.0.0',
    },
  };
  
  zip.file('package.json', JSON.stringify(packageJson, null, 2));
  
  // Add README
  const readme = `# PactJS Consumer Tests

This test suite was generated from OpenAPI/Swagger specifications.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## Generated Tests

- Tests are organized by tags from your OpenAPI specification
- Each test includes example request/response data based on your schemas
- Remember to replace the mock HTTP client calls with your actual API client

## Next Steps

1. Update each test with your actual HTTP client implementation
2. Customize the provider states as needed
3. Run the tests to generate Pact contracts
4. Share the generated Pact files with your provider team

Happy testing! 🚀
`;
  
  zip.file('README.md', readme);
  
  // Generate and download the ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pact-consumer-tests.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
