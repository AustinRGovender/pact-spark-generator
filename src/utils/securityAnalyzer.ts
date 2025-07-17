export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string; // For http type (bearer, basic, etc.)
  bearerFormat?: string;
  in?: 'query' | 'header' | 'cookie'; // For apiKey type
  name?: string; // For apiKey type
  flows?: OAuth2Flows;
  openIdConnectUrl?: string;
  description?: string;
}

export interface OAuth2Flows {
  implicit?: OAuth2Flow;
  password?: OAuth2Flow;
  clientCredentials?: OAuth2Flow;
  authorizationCode?: OAuth2Flow;
}

export interface OAuth2Flow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes?: Record<string, string>;
}

export interface SecurityRequirement {
  [key: string]: string[];
}

export interface AuthTestScenario {
  name: string;
  description: string;
  authType: string;
  credentials?: any;
  expectedStatus: number;
  scenario: 'valid' | 'invalid' | 'expired' | 'insufficient' | 'missing';
}

export class SecurityAnalyzer {
  private securitySchemes: Record<string, SecurityScheme> = {};
  private globalSecurity: SecurityRequirement[] = [];

  analyzeSpec(spec: any): {
    schemes: Record<string, SecurityScheme>;
    globalRequirements: SecurityRequirement[];
    operationSecurity: Record<string, SecurityRequirement[]>;
  } {
    // Parse security schemes from components
    if (spec.components?.securitySchemes) {
      this.securitySchemes = this.parseSecuritySchemes(spec.components.securitySchemes);
    }

    // Parse global security requirements
    if (spec.security) {
      this.globalSecurity = spec.security;
    }

    // Parse operation-level security
    const operationSecurity: Record<string, SecurityRequirement[]> = {};
    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, pathItem]: [string, any]) => {
        const httpMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'patch', 'trace'];
        
        httpMethods.forEach(method => {
          if (pathItem[method]) {
            const operation = pathItem[method];
            const operationKey = `${method.toUpperCase()} ${path}`;
            
            if (operation.security) {
              operationSecurity[operationKey] = operation.security;
            } else if (this.globalSecurity.length > 0) {
              operationSecurity[operationKey] = this.globalSecurity;
            }
          }
        });
      });
    }

    return {
      schemes: this.securitySchemes,
      globalRequirements: this.globalSecurity,
      operationSecurity
    };
  }

  private parseSecuritySchemes(schemes: any): Record<string, SecurityScheme> {
    const parsed: Record<string, SecurityScheme> = {};
    
    Object.entries(schemes).forEach(([name, scheme]: [string, any]) => {
      parsed[name] = this.parseSecurityScheme(scheme);
    });
    
    return parsed;
  }

  private parseSecurityScheme(scheme: any): SecurityScheme {
    const baseScheme: SecurityScheme = {
      type: scheme.type,
      description: scheme.description
    };

    switch (scheme.type) {
      case 'apiKey':
        return {
          ...baseScheme,
          in: scheme.in,
          name: scheme.name
        };
      
      case 'http':
        return {
          ...baseScheme,
          scheme: scheme.scheme,
          bearerFormat: scheme.bearerFormat
        };
      
      case 'oauth2':
        return {
          ...baseScheme,
          flows: scheme.flows
        };
      
      case 'openIdConnect':
        return {
          ...baseScheme,
          openIdConnectUrl: scheme.openIdConnectUrl
        };
      
      default:
        return baseScheme;
    }
  }

  generateAuthTestScenarios(
    operationKey: string,
    securityRequirements: SecurityRequirement[]
  ): AuthTestScenario[] {
    const scenarios: AuthTestScenario[] = [];

    // No authentication scenario
    scenarios.push({
      name: 'No Authentication',
      description: 'Request without any authentication',
      authType: 'none',
      expectedStatus: 401,
      scenario: 'missing'
    });

    securityRequirements.forEach((requirement, index) => {
      Object.entries(requirement).forEach(([schemeName, scopes]) => {
        const scheme = this.securitySchemes[schemeName];
        if (!scheme) return;

        scenarios.push(...this.generateScenariosForScheme(scheme, schemeName, scopes));
      });
    });

    return scenarios;
  }

  private generateScenariosForScheme(
    scheme: SecurityScheme,
    schemeName: string,
    scopes: string[]
  ): AuthTestScenario[] {
    const scenarios: AuthTestScenario[] = [];

    switch (scheme.type) {
      case 'apiKey':
        scenarios.push(
          {
            name: `Valid ${schemeName} API Key`,
            description: `Valid API key in ${scheme.in}`,
            authType: 'apiKey',
            credentials: this.generateApiKeyCredentials(scheme),
            expectedStatus: 200,
            scenario: 'valid'
          },
          {
            name: `Invalid ${schemeName} API Key`,
            description: `Invalid API key in ${scheme.in}`,
            authType: 'apiKey',
            credentials: this.generateInvalidApiKeyCredentials(scheme),
            expectedStatus: 401,
            scenario: 'invalid'
          }
        );
        break;

      case 'http':
        if (scheme.scheme === 'bearer') {
          scenarios.push(
            {
              name: `Valid ${schemeName} Bearer Token`,
              description: 'Valid JWT bearer token',
              authType: 'bearer',
              credentials: this.generateJWTCredentials(scopes),
              expectedStatus: 200,
              scenario: 'valid'
            },
            {
              name: `Expired ${schemeName} Bearer Token`,
              description: 'Expired JWT bearer token',
              authType: 'bearer',
              credentials: this.generateExpiredJWTCredentials(scopes),
              expectedStatus: 401,
              scenario: 'expired'
            },
            {
              name: `Invalid ${schemeName} Bearer Token`,
              description: 'Malformed JWT bearer token',
              authType: 'bearer',
              credentials: { token: 'invalid.jwt.token' },
              expectedStatus: 401,
              scenario: 'invalid'
            }
          );

          if (scopes.length > 0) {
            scenarios.push({
              name: `Insufficient Permissions ${schemeName}`,
              description: 'Valid token with insufficient scopes',
              authType: 'bearer',
              credentials: this.generateJWTCredentials(['read']), // Limited scope
              expectedStatus: 403,
              scenario: 'insufficient'
            });
          }
        } else if (scheme.scheme === 'basic') {
          scenarios.push(
            {
              name: `Valid ${schemeName} Basic Auth`,
              description: 'Valid username and password',
              authType: 'basic',
              credentials: { username: 'testuser', password: 'testpass123' },
              expectedStatus: 200,
              scenario: 'valid'
            },
            {
              name: `Invalid ${schemeName} Basic Auth`,
              description: 'Invalid username or password',
              authType: 'basic',
              credentials: { username: 'testuser', password: 'wrongpass' },
              expectedStatus: 401,
              scenario: 'invalid'
            }
          );
        }
        break;

      case 'oauth2':
        if (scheme.flows) {
          Object.entries(scheme.flows).forEach(([flowType, flow]) => {
            scenarios.push(
              {
                name: `Valid OAuth2 ${flowType} Token`,
                description: `Valid OAuth2 access token from ${flowType} flow`,
                authType: 'oauth2',
                credentials: this.generateOAuth2Credentials(flow, scopes),
                expectedStatus: 200,
                scenario: 'valid'
              },
              {
                name: `Expired OAuth2 ${flowType} Token`,
                description: `Expired OAuth2 access token from ${flowType} flow`,
                authType: 'oauth2',
                credentials: this.generateExpiredOAuth2Credentials(flow, scopes),
                expectedStatus: 401,
                scenario: 'expired'
              }
            );
          });
        }
        break;
    }

    return scenarios;
  }

  private generateApiKeyCredentials(scheme: SecurityScheme): any {
    const apiKey = 'test-api-key-' + Math.random().toString(36).substr(2, 16);
    
    return {
      type: 'apiKey',
      in: scheme.in,
      name: scheme.name,
      value: apiKey
    };
  }

  private generateInvalidApiKeyCredentials(scheme: SecurityScheme): any {
    return {
      type: 'apiKey',
      in: scheme.in,
      name: scheme.name,
      value: 'invalid-api-key'
    };
  }

  private generateJWTCredentials(scopes: string[]): any {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1234567890',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      scope: scopes.join(' '),
      permissions: scopes
    }));
    const signature = 'test-signature';
    
    return {
      token: `${header}.${payload}.${signature}`
    };
  }

  private generateExpiredJWTCredentials(scopes: string[]): any {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '1234567890',
      name: 'Test User',
      iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
      scope: scopes.join(' '),
      permissions: scopes
    }));
    const signature = 'test-signature';
    
    return {
      token: `${header}.${payload}.${signature}`
    };
  }

  private generateOAuth2Credentials(flow: OAuth2Flow, scopes: string[]): any {
    return {
      access_token: 'oauth2-access-token-' + Math.random().toString(36).substr(2, 32),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopes.join(' '),
      refresh_token: flow.refreshUrl ? 'oauth2-refresh-token-' + Math.random().toString(36).substr(2, 32) : undefined
    };
  }

  private generateExpiredOAuth2Credentials(flow: OAuth2Flow, scopes: string[]): any {
    return {
      access_token: 'expired-oauth2-access-token-' + Math.random().toString(36).substr(2, 32),
      token_type: 'Bearer',
      expires_in: -1, // Expired
      scope: scopes.join(' ')
    };
  }

  generateAuthSetupCode(securityRequirements: SecurityRequirement[]): string {
    const authSetups: string[] = [];

    securityRequirements.forEach(requirement => {
      Object.entries(requirement).forEach(([schemeName, scopes]) => {
        const scheme = this.securitySchemes[schemeName];
        if (!scheme) return;

        authSetups.push(this.generateSchemeSetupCode(scheme, schemeName, scopes));
      });
    });

    return authSetups.join('\n\n');
  }

  private generateSchemeSetupCode(scheme: SecurityScheme, schemeName: string, scopes: string[]): string {
    switch (scheme.type) {
      case 'apiKey':
        return this.generateApiKeySetupCode(scheme, schemeName);
      case 'http':
        return this.generateHttpSetupCode(scheme, schemeName);
      case 'oauth2':
        return this.generateOAuth2SetupCode(scheme, schemeName, scopes);
      default:
        return `// ${schemeName}: ${scheme.type} authentication setup`;
    }
  }

  private generateApiKeySetupCode(scheme: SecurityScheme, schemeName: string): string {
    const location = scheme.in === 'header' ? 'headers' : scheme.in === 'query' ? 'query' : 'cookie';
    const keyName = scheme.name || 'apiKey';

    return `// API Key authentication setup for ${schemeName}
const ${schemeName}ApiKey = 'your-api-key-here';
const ${schemeName}Auth = {
  ${location}: {
    '${keyName}': ${schemeName}ApiKey
  }
};`;
  }

  private generateHttpSetupCode(scheme: SecurityScheme, schemeName: string): string {
    if (scheme.scheme === 'bearer') {
      return `// Bearer token authentication setup for ${schemeName}
const ${schemeName}Token = 'your-jwt-token-here';
const ${schemeName}Auth = {
  headers: {
    'Authorization': \`Bearer \${${schemeName}Token}\`
  }
};`;
    } else if (scheme.scheme === 'basic') {
      return `// Basic authentication setup for ${schemeName}
const ${schemeName}Username = 'your-username';
const ${schemeName}Password = 'your-password';
const ${schemeName}Auth = {
  headers: {
    'Authorization': 'Basic ' + btoa(\`\${${schemeName}Username}:\${${schemeName}Password}\`)
  }
};`;
    }
    
    return `// HTTP ${scheme.scheme} authentication setup for ${schemeName}`;
  }

  private generateOAuth2SetupCode(scheme: SecurityScheme, schemeName: string, scopes: string[]): string {
    return `// OAuth2 authentication setup for ${schemeName}
const ${schemeName}AccessToken = 'your-oauth2-access-token';
const ${schemeName}Auth = {
  headers: {
    'Authorization': \`Bearer \${${schemeName}AccessToken}\`
  }
};

// Required scopes: ${scopes.join(', ')}`;
  }
}