import { AuthTestScenario } from './securityAnalyzer';

export const generateAuthSetupForScenario = (scenario: AuthTestScenario): string => {
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

export const generateRequestAuthForScenario = (scenario: AuthTestScenario): string => {
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

export const generateExpectedErrorResponse = (scenario: AuthTestScenario, status: number): string => {
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

export const generateAuthHeadersForOperation = (operation: any, securityAnalysis?: any): string => {
  if (!securityAnalysis || !operation.path || !operation.method) {
    return '';
  }

  const operationKey = `${operation.method} ${operation.path}`;
  const operationSecurity = securityAnalysis.operationSecurity[operationKey];
  
  if (!operationSecurity || operationSecurity.length === 0) {
    return '';
  }

  const firstRequirement = operationSecurity[0];
  const schemeName = Object.keys(firstRequirement)[0];
  const scheme = securityAnalysis.schemes[schemeName];
  
  if (!scheme) {
    return '';
  }

  switch (scheme.type) {
    case 'apiKey':
      if (scheme.in === 'header') {
        return `,
            '${scheme.name}': '{{API_KEY}}'`;
      }
      break;
    
    case 'http':
      if (scheme.scheme === 'bearer') {
        return `,
            'Authorization': 'Bearer {{JWT_TOKEN}}'`;
      } else if (scheme.scheme === 'basic') {
        return `,
            'Authorization': 'Basic {{BASIC_AUTH}}'`;
      }
      break;
    
    case 'oauth2':
      return `,
            'Authorization': 'Bearer {{OAUTH2_TOKEN}}'`;
  }
  
  return '';
};

export const generateProviderAuthSetup = (scenario: AuthTestScenario): string => {
  switch (scenario.authType) {
    case 'apiKey':
      return `// Validate API key
        const expectedApiKey = '${scenario.credentials?.value || 'test-api-key'}';
        const providedKey = req.headers['${scenario.credentials?.name?.toLowerCase() || 'x-api-key'}'] || req.query['${scenario.credentials?.name || 'api_key'}'];
        if (providedKey !== expectedApiKey && '${scenario.scenario}' === 'valid') {
          res.status(401).json({ error: 'Invalid API key' });
          return;
        }`;
    
    case 'bearer':
      return `// Validate Bearer token
        const authHeader = req.headers.authorization;
        const expectedToken = '${scenario.credentials?.token || 'valid-jwt-token'}';
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedToken) {
          if ('${scenario.scenario}' === 'valid') {
            res.status(401).json({ error: 'Invalid bearer token' });
            return;
          }
        }`;
    
    case 'basic':
      return `// Validate Basic auth
        const authHeader = req.headers.authorization;
        const expectedCredentials = btoa('${scenario.credentials?.username || 'testuser'}:${scenario.credentials?.password || 'testpass'}');
        if (!authHeader || !authHeader.startsWith('Basic ') || authHeader.split(' ')[1] !== expectedCredentials) {
          if ('${scenario.scenario}' === 'valid') {
            res.status(401).json({ error: 'Invalid basic auth' });
            return;
          }
        }`;
    
    case 'oauth2':
      return `// Validate OAuth2 token
        const authHeader = req.headers.authorization;
        const expectedToken = '${scenario.credentials?.access_token || 'valid-oauth2-token'}';
        if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== expectedToken) {
          if ('${scenario.scenario}' === 'valid') {
            res.status(401).json({ error: 'Invalid OAuth2 token' });
            return;
          }
        }`;
    
    default:
      return '// No authentication required';
  }
};