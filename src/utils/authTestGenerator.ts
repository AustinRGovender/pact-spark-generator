import { ParsedOperation } from './swaggerParser';
import { AuthTestScenario } from './securityAnalyzer';

export const generateAuthenticationTest = (
  operation: ParsedOperation,
  scenario: AuthTestScenario,
  testType: 'consumer' | 'provider'
): string => {
  const { path, method, summary } = operation;
  const testName = `should handle ${scenario.name.toLowerCase()} for ${method} ${path}`;
  
  const authSetup = generateAuthSetupForScenario(scenario);
  const expectedStatus = scenario.expectedStatus;
  
  return `
  it('${testName}', async () => {
    ${authSetup}
    
    await provider.addInteraction({
      state: '${scenario.description}',
      uponReceiving: '${method} request to ${path} with ${scenario.name.toLowerCase()}',
      withRequest: {
        method: '${method}',
        path: '${path}',
        ${generateRequestAuthForScenario(scenario)}
      },
      willRespondWith: {
        status: ${expectedStatus},
        headers: {
          'Content-Type': 'application/json',
        },
        body: ${generateExpectedErrorResponse(scenario, expectedStatus)},
      },
    });

    // Make the actual request here with authentication
    // Expect ${expectedStatus} status code
  });
`;
};

const generateAuthSetupForScenario = (scenario: AuthTestScenario): string => {
  switch (scenario.authType) {
    case 'apiKey':
      return `const apiKey = '${scenario.credentials?.value || 'invalid-key'}';`;
    
    case 'bearer':
      return `const bearerToken = '${scenario.credentials?.token || 'invalid-token'}';`;
    
    case 'basic':
      return `const basicCredentials = {
      username: '${scenario.credentials?.username || 'invalid'}',
      password: '${scenario.credentials?.password || 'invalid'}'
    };`;
    
    case 'oauth2':
      return `const oauth2Token = '${scenario.credentials?.access_token || 'invalid-oauth2-token'}';`;
    
    case 'none':
    default:
      return '// No authentication setup';
  }
};

const generateRequestAuthForScenario = (scenario: AuthTestScenario): string => {
  if (scenario.scenario === 'missing') {
    return '// No authentication headers';
  }

  switch (scenario.authType) {
    case 'apiKey':
      const apiKeyLocation = scenario.credentials?.in || 'header';
      const apiKeyName = scenario.credentials?.name || 'X-API-Key';
      
      if (apiKeyLocation === 'header') {
        return `headers: {
          '${apiKeyName}': apiKey,
        },`;
      } else if (apiKeyLocation === 'query') {
        return `query: {
          '${apiKeyName}': apiKey,
        },`;
      } else {
        return `// Cookie-based API key authentication
        headers: {
          'Cookie': '${apiKeyName}=' + apiKey,
        },`;
      }
    
    case 'bearer':
      return `headers: {
        'Authorization': 'Bearer ' + bearerToken,
      },`;
    
    case 'basic':
      return `headers: {
        'Authorization': 'Basic ' + btoa(basicCredentials.username + ':' + basicCredentials.password),
      },`;
    
    case 'oauth2':
      return `headers: {
        'Authorization': 'Bearer ' + oauth2Token,
      },`;
    
    default:
      return '// No authentication headers';
  }
};

const generateExpectedErrorResponse = (scenario: AuthTestScenario, status: number): string => {
  const errorMessages = {
    401: {
      missing: 'Authentication required',
      invalid: 'Invalid authentication credentials',
      expired: 'Authentication token has expired'
    },
    403: {
      insufficient: 'Insufficient permissions to access this resource'
    }
  };

  const message = status === 401 
    ? errorMessages[401][scenario.scenario as keyof typeof errorMessages[401]] || 'Authentication failed'
    : status === 403 
    ? errorMessages[403][scenario.scenario as keyof typeof errorMessages[403]] || 'Access denied'
    : 'Request failed';

  return JSON.stringify({
    error: {
      code: status,
      message: message,
      type: scenario.scenario
    }
  }, null, 8);
};

export const generateAuthHeaders = (scheme: any, schemeName: string): string => {
  switch (scheme.type) {
    case 'apiKey':
      if (scheme.in === 'header') {
        return `,
        headers: {
          '${scheme.name}': ${schemeName}ApiKey,
        }`;
      } else if (scheme.in === 'query') {
        return `,
        query: {
          '${scheme.name}': ${schemeName}ApiKey,
        }`;
      } else {
        return `,
        headers: {
          'Cookie': '${scheme.name}=' + ${schemeName}ApiKey,
        }`;
      }
    
    case 'http':
      if (scheme.scheme === 'bearer') {
        return `,
        headers: {
          'Authorization': 'Bearer ' + ${schemeName}Token,
        }`;
      } else if (scheme.scheme === 'basic') {
        return `,
        headers: {
          'Authorization': 'Basic ' + btoa(${schemeName}Credentials.username + ':' + ${schemeName}Credentials.password),
        }`;
      }
      break;
    
    case 'oauth2':
      return `,
        headers: {
          'Authorization': 'Bearer ' + ${schemeName}AccessToken,
        }`;
  }
  
  return '';
};