
import JSZip from 'jszip';

export interface GeneratedTest {
  filename: string;
  content: string;
  tag: string;
  endpoint: string;
  method: string;
}

export const downloadZip = async (tests: GeneratedTest[], isProviderMode: boolean = false): Promise<void> => {
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
    name: `pact-${isProviderMode ? 'provider' : 'consumer'}-tests`,
    version: '1.0.0',
    description: `Generated PactJS ${isProviderMode ? 'provider' : 'consumer'} tests`,
    scripts: {
      test: 'jest',
      'test:pact': `jest --testPathPattern=pact`,
      ...(isProviderMode ? {
        'test:provider': 'jest --testPathPattern=provider',
        'verify:pacts': 'node scripts/verify-pacts.js'
      } : {
        'test:consumer': 'jest --testPathPattern=consumer',
        'publish:pacts': 'node scripts/publish-pacts.js'
      })
    },
    devDependencies: {
      '@pact-foundation/pact': '^15.0.1',
      jest: '^29.0.0',
      supertest: '^6.3.0'
    }
  };
  
  zip.file('package.json', JSON.stringify(packageJson, null, 2));

  // Add README
  const readme = `# Generated PactJS ${isProviderMode ? 'Provider' : 'Consumer'} Tests

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
${isProviderMode ? `
- Provider verification setup
- State handlers for different scenarios
- Direct API endpoint testing
- Contract verification against consumer expectations
` : `
- Consumer contract setup
- Request/response expectations
- Mock data generation
- Contract publishing configuration
`}

## ${isProviderMode ? 'Provider' : 'Consumer'} Mode

${isProviderMode ? `
This is a **Provider** test suite that:
- Verifies your API against consumer contracts
- Tests your actual API endpoints
- Validates that your API meets the consumer expectations
- Can be integrated into your CI/CD pipeline

### Environment Variables
- \`PROVIDER_BASE_URL\`: Your API base URL (default: http://localhost:3000)
- \`PROVIDER_VERSION\`: Version of your API being tested
- \`CI\`: Set to 'true' to publish verification results
` : `
This is a **Consumer** test suite that:
- Defines expectations for provider APIs
- Generates contract files (pacts)
- Can be used to stub provider APIs during development
- Enables contract-driven testing

### Usage
1. Update the consumer code sections in each test
2. Run tests to generate pact files
3. Share pact files with your API providers
`}

## Next Steps

1. ${isProviderMode ? 'Configure your API endpoints and state handlers' : 'Update the consumer code sections in each test'}
2. Adjust mock data to match your actual API responses
3. ${isProviderMode ? 'Set up provider state management' : 'Configure pact publishing to your broker'}
4. ${isProviderMode ? 'Run provider verification tests' : 'Run consumer tests to generate contracts'}
`;

  zip.file('README.md', readme);

  // Add environment configuration file
  const envExample = isProviderMode ? `
# Provider Configuration
PROVIDER_BASE_URL=http://localhost:3000
PROVIDER_VERSION=1.0.0
CI=false

# Pact Broker (if using)
PACT_BROKER_BASE_URL=https://your-pact-broker.com
PACT_BROKER_TOKEN=your-broker-token
` : `
# Consumer Configuration
CONSUMER_VERSION=1.0.0
CI=false

# Pact Broker (if using)
PACT_BROKER_BASE_URL=https://your-pact-broker.com
PACT_BROKER_TOKEN=your-broker-token
`;

  zip.file('.env.example', envExample.trim());

  // Generate and download the ZIP
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pact-${isProviderMode ? 'provider' : 'consumer'}-tests.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
