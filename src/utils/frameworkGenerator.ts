import JSZip from 'jszip';
import { FrameworkConfig, ProjectScaffolding, GeneratedFile, FrameworkGenerationResult } from '../types/frameworkTypes';
import { ParsedSpec } from './swaggerParser';

export class FrameworkGenerator {
  static async generateFramework(
    config: FrameworkConfig,
    openApiSpec?: ParsedSpec
  ): Promise<FrameworkGenerationResult> {
    try {
      const scaffolding = await this.createProjectScaffolding(config, openApiSpec);
      const downloadUrl = await this.createDownloadPackage(scaffolding);
      
      return {
        success: true,
        scaffolding,
        downloadUrl
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private static async createProjectScaffolding(
    config: FrameworkConfig,
    spec?: ParsedSpec
  ): Promise<ProjectScaffolding> {
    const files: GeneratedFile[] = [];
    
    // Generate base project structure
    files.push(...this.generateBaseStructure(config));
    
    // Generate API files from OpenAPI spec
    if (spec) {
      files.push(...this.generateApiFiles(config, spec));
    }
    
    // Generate feature-specific files
    files.push(...this.generateFeatureFiles(config));
    
    // Generate configuration files
    files.push(...this.generateConfigFiles(config));
    
    // Generate documentation
    files.push(...this.generateDocumentation(config, spec));

    const instructions = this.generateInstructions(config);

    return {
      projectName: config.projectName,
      config,
      files,
      instructions
    };
  }

  private static generateBaseStructure(config: FrameworkConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    switch (config.framework) {
      case 'express':
        files.push(...this.generateExpressStructure(config));
        break;
      case 'fastify':
        files.push(...this.generateFastifyStructure(config));
        break;
      case 'nestjs':
        files.push(...this.generateNestJSStructure(config));
        break;
      case 'spring-boot':
        files.push(...this.generateSpringBootStructure(config));
        break;
      case 'dotnet-core':
        files.push(...this.generateDotNetStructure(config));
        break;
      case 'fastapi':
        files.push(...this.generateFastAPIStructure(config));
        break;
      default:
        throw new Error(`Unsupported framework: ${config.framework}`);
    }
    
    return files;
  }

  private static generateExpressStructure(config: FrameworkConfig): GeneratedFile[] {
    const projectName = config.projectName;
    
    return [
      {
        path: 'package.json',
        content: this.generatePackageJson(config),
        description: 'Node.js package configuration'
      },
      {
        path: 'src/app.ts',
        content: this.generateExpressApp(config),
        description: 'Main Express application'
      },
      {
        path: 'src/server.ts',
        content: this.generateExpressServer(config),
        description: 'Server entry point'
      },
      {
        path: 'src/routes/index.ts',
        content: this.generateExpressRoutes(config),
        description: 'Route definitions'
      },
      {
        path: 'src/middleware/errorHandler.ts',
        content: this.generateErrorHandler(config),
        description: 'Error handling middleware'
      },
      {
        path: 'src/middleware/logger.ts',
        content: this.generateLogger(config),
        description: 'Request logging middleware'
      },
      {
        path: 'src/config/database.ts',
        content: this.generateDatabaseConfig(config),
        description: 'Database configuration'
      },
      {
        path: 'tsconfig.json',
        content: this.generateTsConfig(),
        description: 'TypeScript configuration'
      },
      {
        path: '.env.example',
        content: this.generateEnvExample(config),
        description: 'Environment variables template'
      }
    ];
  }

  private static generatePackageJson(config: FrameworkConfig): string {
    const dependencies: Record<string, string> = {
      express: '^4.18.2',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      'express-rate-limit': '^6.7.0'
    };

    const devDependencies: Record<string, string> = {
      '@types/node': '^20.0.0',
      '@types/express': '^4.17.17',
      '@types/cors': '^2.8.13',
      typescript: '^5.0.0',
      'ts-node': '^10.9.0',
      nodemon: '^3.0.0',
      eslint: '^8.0.0',
      prettier: '^3.0.0'
    };

    if (config.features.database !== 'none') {
      if (config.features.database === 'postgresql') {
        dependencies.pg = '^8.11.0';
        devDependencies['@types/pg'] = '^8.10.0';
      }
      if (config.features.database === 'mongodb') {
        dependencies.mongoose = '^7.0.0';
      }
    }

    if (config.features.authentication !== 'none') {
      dependencies.jsonwebtoken = '^9.0.0';
      dependencies.bcryptjs = '^2.4.3';
      devDependencies['@types/jsonwebtoken'] = '^9.0.0';
      devDependencies['@types/bcryptjs'] = '^2.4.2';
    }

    if (config.features.testing) {
      devDependencies.jest = '^29.0.0';
      devDependencies['@types/jest'] = '^29.0.0';
      devDependencies.supertest = '^6.3.0';
      devDependencies['@types/supertest'] = '^2.0.12';
    }

    return JSON.stringify({
      name: config.projectName,
      version: config.version,
      description: config.description,
      main: 'dist/server.js',
      scripts: {
        start: 'node dist/server.js',
        dev: 'nodemon src/server.ts',
        build: 'tsc',
        test: config.features.testing ? 'jest' : 'echo "No tests specified"',
        lint: 'eslint src/**/*.ts',
        'lint:fix': 'eslint src/**/*.ts --fix'
      },
      keywords: ['api', 'express', 'typescript'],
      author: config.author,
      license: 'MIT',
      dependencies,
      devDependencies
    }, null, 2);
  }

  private static generateExpressApp(config: FrameworkConfig): string {
    return `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: '${config.projectName}'
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;`;
  }

  private static generateExpressServer(config: FrameworkConfig): string {
    return `import app from './app';
${config.features.database !== 'none' ? "import { connectDatabase } from './config/database';" : ''}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    ${config.features.database !== 'none' ? 'await connectDatabase();' : ''}
    
    app.listen(PORT, () => {
      console.log(\`🚀 Server running on port \${PORT}\`);
      console.log(\`📚 Health check: http://localhost:\${PORT}/health\`);
      ${config.features.apiDocumentation ? "console.log(\`📖 API docs: http://localhost:\${PORT}/api/docs\`);" : ''}
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});`;
  }

  private static generateExpressRoutes(config: FrameworkConfig): string {
    return `import { Router } from 'express';

const router = Router();

// Example route
router.get('/', (req, res) => {
  res.json({
    message: 'Welcome to ${config.projectName} API',
    version: '${config.version}',
    timestamp: new Date().toISOString()
  });
});

// TODO: Add your API routes here
// Example:
// router.use('/users', userRoutes);
// router.use('/auth', authRoutes);

export default router;`;
  }

  private static generateApiFiles(config: FrameworkConfig, spec: ParsedSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    // Generate routes for each operation
    spec.operations.forEach(operation => {
      const routeFile = this.generateRouteFromOperation(config, operation);
      if (routeFile) {
        files.push(routeFile);
      }
    });

    // Generate models from schemas
    if (spec.schemas) {
      Object.entries(spec.schemas).forEach(([name, schema]) => {
        const modelFile = this.generateModelFromSchema(config, name, schema);
        if (modelFile) {
          files.push(modelFile);
        }
      });
    }

    return files;
  }

  private static generateRouteFromOperation(config: FrameworkConfig, operation: any): GeneratedFile | null {
    const routeName = operation.tags?.[0] || 'default';
    const fileName = `src/routes/${routeName.toLowerCase()}.ts`;
    
    const content = `import { Router, Request, Response } from 'express';

const router = Router();

// ${operation.method.toUpperCase()} ${operation.path}
// ${operation.summary || 'Generated endpoint'}
router.${operation.method.toLowerCase()}('${operation.path.replace(/\{([^}]+)\}/g, ':$1')}', async (req: Request, res: Response) => {
  try {
    // TODO: Implement your business logic here
    res.json({
      message: 'Operation ${operation.operationId || operation.method + operation.path} not implemented yet',
      method: '${operation.method.toUpperCase()}',
      path: '${operation.path}'
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;`;

    return {
      path: fileName,
      content,
      description: `Route handler for ${operation.summary || operation.path}`
    };
  }

  private static generateModelFromSchema(config: FrameworkConfig, name: string, schema: any): GeneratedFile | null {
    const fileName = `src/models/${name}.ts`;
    
    const content = `// Generated model for ${name}
export interface ${name} {
  // TODO: Add your model properties based on the schema
  id?: string | number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ${name}Service {
  // TODO: Implement your business logic methods
  
  static async create(data: Partial<${name}>): Promise<${name}> {
    throw new Error('Method not implemented');
  }
  
  static async findById(id: string | number): Promise<${name} | null> {
    throw new Error('Method not implemented');
  }
  
  static async update(id: string | number, data: Partial<${name}>): Promise<${name}> {
    throw new Error('Method not implemented');
  }
  
  static async delete(id: string | number): Promise<boolean> {
    throw new Error('Method not implemented');
  }
}`;

    return {
      path: fileName,
      content,
      description: `Model and service for ${name}`
    };
  }

  private static generateFeatureFiles(config: FrameworkConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    
    if (config.features.authentication !== 'none') {
      files.push(...this.generateAuthFiles(config));
    }
    
    if (config.features.testing) {
      files.push(...this.generateTestFiles(config));
    }
    
    if (config.features.docker) {
      files.push(...this.generateDockerFiles(config));
    }
    
    if (config.features.cicd !== 'none') {
      files.push(...this.generateCiCdFiles(config));
    }
    
    return files;
  }

  private static generateAuthFiles(config: FrameworkConfig): GeneratedFile[] {
    return [
      {
        path: 'src/middleware/auth.ts',
        content: this.generateAuthMiddleware(config),
        description: 'Authentication middleware'
      },
      {
        path: 'src/services/authService.ts',
        content: this.generateAuthService(config),
        description: 'Authentication service'
      }
    ];
  }

  private static generateTestFiles(config: FrameworkConfig): GeneratedFile[] {
    return [
      {
        path: 'tests/app.test.ts',
        content: this.generateAppTest(config),
        description: 'Application tests'
      },
      {
        path: 'jest.config.js',
        content: this.generateJestConfig(),
        description: 'Jest testing configuration'
      }
    ];
  }

  private static generateDockerFiles(config: FrameworkConfig): GeneratedFile[] {
    return [
      {
        path: 'Dockerfile',
        content: this.generateDockerfile(config),
        description: 'Docker container configuration'
      },
      {
        path: 'docker-compose.yml',
        content: this.generateDockerCompose(config),
        description: 'Docker Compose configuration'
      },
      {
        path: '.dockerignore',
        content: this.generateDockerIgnore(),
        description: 'Docker ignore file'
      }
    ];
  }

  private static generateCiCdFiles(config: FrameworkConfig): GeneratedFile[] {
    if (config.features.cicd === 'github-actions') {
      return [
        {
          path: '.github/workflows/ci.yml',
          content: this.generateGitHubActions(config),
          description: 'GitHub Actions CI/CD pipeline'
        }
      ];
    }
    return [];
  }

  private static generateConfigFiles(config: FrameworkConfig): GeneratedFile[] {
    return [
      {
        path: '.gitignore',
        content: this.generateGitIgnore(config),
        description: 'Git ignore file'
      },
      {
        path: '.eslintrc.js',
        content: this.generateEslintConfig(),
        description: 'ESLint configuration'
      },
      {
        path: '.prettierrc',
        content: this.generatePrettierConfig(),
        description: 'Prettier configuration'
      }
    ];
  }

  private static generateDocumentation(config: FrameworkConfig, spec?: ParsedSpec): GeneratedFile[] {
    const files: GeneratedFile[] = [
      {
        path: 'README.md',
        content: this.generateReadme(config, spec),
        description: 'Project documentation'
      }
    ];

    if (config.features.apiDocumentation && spec) {
      files.push({
        path: 'docs/api.md',
        content: this.generateApiDocs(config, spec),
        description: 'API documentation'
      });
    }

    return files;
  }

  private static generateInstructions(config: FrameworkConfig): string[] {
    const instructions = [
      '1. Extract the downloaded ZIP file',
      '2. Navigate to the project directory',
      '3. Copy .env.example to .env and configure your environment variables',
      '4. Install dependencies: npm install',
      '5. Start development server: npm run dev'
    ];

    if (config.features.database !== 'none') {
      instructions.splice(4, 0, '4. Set up your database and update connection settings in .env');
    }

    if (config.features.docker) {
      instructions.push('Alternative: Use Docker: docker-compose up');
    }

    return instructions;
  }

  // Helper methods for generating specific file contents
  private static generateErrorHandler(config: FrameworkConfig): string {
    return `import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(\`Error \${statusCode}: \${message}\`, err.stack);

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};`;
  }

  private static generateLogger(config: FrameworkConfig): string {
    return `import { Request, Response, NextFunction } from 'express';

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(\`\${req.method} \${req.path} \${res.statusCode} - \${duration}ms\`);
  });
  
  next();
};`;
  }

  private static generateDatabaseConfig(config: FrameworkConfig): string {
    if (config.features.database === 'postgresql') {
      return `import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '${config.projectName}',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

export const connectDatabase = async () => {
  try {
    await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

export { pool };`;
    }

    if (config.features.database === 'mongodb') {
      return `import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/${config.projectName}';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB database');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};`;
    }

    return `// Database configuration
// No database selected for this project`;
  }

  private static generateTsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests']
    }, null, 2);
  }

  private static generateEnvExample(config: FrameworkConfig): string {
    let content = `# Environment Configuration
NODE_ENV=development
PORT=3000

# Application
APP_NAME=${config.projectName}
APP_VERSION=${config.version}
`;

    if (config.features.database === 'postgresql') {
      content += `
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${config.projectName}
DB_USER=postgres
DB_PASSWORD=password
`;
    }

    if (config.features.database === 'mongodb') {
      content += `
# Database (MongoDB)
MONGODB_URI=mongodb://localhost:27017/${config.projectName}
`;
    }

    if (config.features.authentication !== 'none') {
      content += `
# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
`;
    }

    return content;
  }

  // Additional helper methods would go here for other file types
  private static generateAuthMiddleware(config: FrameworkConfig): string {
    return `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};`;
  }

  private static generateAuthService(config: FrameworkConfig): string {
    return `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export class AuthService {
  static generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}`;
  }

  private static generateAppTest(config: FrameworkConfig): string {
    return `import request from 'supertest';
import app from '../src/app';

describe('${config.projectName} API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', '${config.projectName}');
    });
  });

  describe('GET /api', () => {
    it('should return API info', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version', '${config.version}');
    });
  });
});`;
  }

  private static generateJestConfig(): string {
    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};`;
  }

  private static generateDockerfile(config: FrameworkConfig): string {
    return `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]`;
  }

  private static generateDockerCompose(config: FrameworkConfig): string {
    let services = `version: '3.8'

services:
  ${config.projectName}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:`;

    if (config.features.database === 'postgresql') {
      services += `
      - postgres
    volumes:
      - ./.env:/app/.env

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${config.projectName}
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:`;
    } else if (config.features.database === 'mongodb') {
      services += `
      - mongodb
    volumes:
      - ./.env:/app/.env

  mongodb:
    image: mongo:6-alpine
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:`;
    } else {
      services += `
    volumes:
      - ./.env:/app/.env`;
    }

    return services;
  }

  private static generateDockerIgnore(): string {
    return `node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.coverage/
dist`;
  }

  private static generateGitHubActions(config: FrameworkConfig): string {
    return `name: CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to production
      run: echo "Add your deployment script here"`;
  }

  private static generateGitIgnore(config: FrameworkConfig): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage
.grunt

# Bower dependency directory
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons
build/Release

# Dependency directories
node_modules/
jspm_packages/

# TypeScript v1 declaration files
typings/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# parcel-bundler cache
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build output
dist/
build/

# Logs
logs
*.log`;
  }

  private static generateEslintConfig(): string {
    return `module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
  },
  env: {
    node: true,
    es6: true,
  },
};`;
  }

  private static generatePrettierConfig(): string {
    return JSON.stringify({
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false
    }, null, 2);
  }

  private static generateReadme(config: FrameworkConfig, spec?: ParsedSpec): string {
    return `# ${config.projectName}

${config.description}

## Features

- ✅ ${config.framework.toUpperCase()} framework
- ✅ TypeScript support
- ✅ Express.js with security middleware
${config.features.authentication !== 'none' ? '- ✅ JWT Authentication' : ''}
${config.features.database !== 'none' ? `- ✅ ${config.features.database.toUpperCase()} database integration` : ''}
${config.features.testing ? '- ✅ Jest testing framework' : ''}
${config.features.docker ? '- ✅ Docker containerization' : ''}
${config.features.cicd !== 'none' ? '- ✅ CI/CD pipeline' : ''}
${config.features.apiDocumentation ? '- ✅ API documentation' : ''}

## Quick Start

1. Copy \`.env.example\` to \`.env\` and configure your environment variables
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open http://localhost:3000 in your browser

## API Endpoints

${spec ? this.generateApiEndpointsList(spec) : '- GET /health - Health check endpoint\n- GET /api - API information'}

## Development

### Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build for production
- \`npm start\` - Start production server
- \`npm test\` - Run tests
- \`npm run lint\` - Run ESLint
- \`npm run lint:fix\` - Fix ESLint errors

### Project Structure

\`\`\`
src/
├── app.ts              # Express app configuration
├── server.ts           # Server entry point
├── routes/             # API route handlers
├── middleware/         # Custom middleware
├── models/             # Data models
├── services/           # Business logic
├── config/             # Configuration files
└── utils/              # Utility functions
\`\`\`

## Deployment

${config.features.docker ? `### Docker

Build and run with Docker:
\`\`\`bash
docker build -t ${config.projectName} .
docker run -p 3000:3000 ${config.projectName}
\`\`\`

Or use Docker Compose:
\`\`\`bash
docker-compose up
\`\`\`
` : ''}

### Production

1. Build the application:
   \`\`\`bash
   npm run build
   \`\`\`

2. Start the production server:
   \`\`\`bash
   npm start
   \`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.`;
  }

  private static generateApiEndpointsList(spec: ParsedSpec): string {
    return spec.operations.map(op => 
      `- ${op.method.toUpperCase()} ${op.path} - ${op.summary || 'Endpoint description'}`
    ).join('\n');
  }

  private static generateApiDocs(config: FrameworkConfig, spec: ParsedSpec): string {
    return `# API Documentation

## Overview

${spec.info?.description || 'API documentation for ' + config.projectName}

**Version:** ${spec.info?.version || config.version}

## Base URL

\`\`\`
http://localhost:3000/api
\`\`\`

## Endpoints

${spec.operations.map(op => `
### ${op.method.toUpperCase()} ${op.path}

${op.summary || 'Endpoint description'}

${op.description ? `**Description:** ${op.description}` : ''}

**Parameters:**
${Array.isArray(op.parameters) && op.parameters.length > 0 ? op.parameters.map((p: any) => `- \`${p.name}\` (${p.in}) - ${p.description || 'Parameter description'}`).join('\n') : 'No parameters'}

**Response:**
\`\`\`json
{
  "message": "Success",
  "data": {}
}
\`\`\`
`).join('\n')}`;
  }

  // Placeholder methods for other frameworks
  private static generateFastifyStructure(config: FrameworkConfig): GeneratedFile[] {
    // TODO: Implement Fastify structure
    return [];
  }

  private static generateNestJSStructure(config: FrameworkConfig): GeneratedFile[] {
    // TODO: Implement NestJS structure
    return [];
  }

  private static generateSpringBootStructure(config: FrameworkConfig): GeneratedFile[] {
    // TODO: Implement Spring Boot structure
    return [];
  }

  private static generateDotNetStructure(config: FrameworkConfig): GeneratedFile[] {
    // TODO: Implement .NET Core structure
    return [];
  }

  private static generateFastAPIStructure(config: FrameworkConfig): GeneratedFile[] {
    // TODO: Implement FastAPI structure
    return [];
  }

  private static async createDownloadPackage(scaffolding: ProjectScaffolding): Promise<string> {
    const zip = new JSZip();
    
    scaffolding.files.forEach(file => {
      zip.file(file.path, file.content);
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    
    return url;
  }
}