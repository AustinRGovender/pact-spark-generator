
import JSZip from 'jszip';

export interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

export const downloadZip = async (tests: GeneratedTest[]): Promise<void> => {
  const zip = new JSZip();
  
  // Group tests by tag
  const testsByTag: { [key: string]: GeneratedTest[] } = {};
  tests.forEach(test => {
    if (!testsByTag[test.tag]) {
      testsByTag[test.tag] = [];
    }
    testsByTag[test.tag].push(test);
  });

  // Create folders and files
  Object.keys(testsByTag).forEach(tag => {
    const folder = zip.folder(tag);
    testsByTag[tag].forEach(test => {
      folder?.file(test.filename, test.content);
    });
  });

  // Add package.json for the test suite
  const packageJson = {
    name: 'pact-consumer-tests',
    version: '1.0.0',
    description: 'Generated PactJS consumer tests',
    scripts: {
      test: 'jest',
      'test:pact': 'jest --testPathPattern=pact'
    },
    devDependencies: {
      '@pact-foundation/pact': '^15.0.1',
      jest: '^29.0.0'
    }
  };
  
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // Add README
  const readme = `# Generated PactJS Consumer Tests

This test suite was generated from your OpenAPI/Swagger specifications.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run tests:
   \`\`\`bash
   npm test
   \`\`\`

## Structure

Tests are organized by tags from your OpenAPI spec. Each test includes:
- Consumer contract setup
- Request/response expectations
- Mock data generation

## Next Steps

1. Update the consumer code sections in each test
2. Adjust mock data to match your actual API responses
3. Run tests against your provider using Pact Broker
`;

  zip.file('README.md', readme);

  // Generate and download the ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pact-consumer-tests.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
