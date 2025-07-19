import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';
import { TemplateEngine } from '../../utils/templateEngine';

export class GoPactGenerator extends LanguageGenerator {
  constructor() {
    super('go');
  }

  generateTestSuite(testSuite: TestSuite, config: LanguageConfig): GeneratedOutput {
    const files: GeneratedFile[] = [];
    const dependencies = this.generateDependencies(config);
    const projectStructure = this.generateProjectStructure(testSuite.name);
    const projectConfig = this.generateProjectConfiguration(config);

    // Generate consumer tests
    files.push(this.generateConsumerTest(testSuite, config));
    
    // Generate provider tests
    files.push(this.generateProviderTest(testSuite, config));
    
    // Generate configuration files
    files.push(...this.generateConfigurationFiles(config));
    
    // Generate module files
    files.push(...this.generateModuleFiles(config, dependencies, testSuite.name));

    return {
      files,
      projectStructure,
      setupInstructions: this.generateSetupInstructions(config),
      dependencies,
      configuration: projectConfig
    };
  }

  private generateConsumerTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `package consumer

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/pact-foundation/pact-go/v2/consumer"
	"github.com/pact-foundation/pact-go/v2/matchers"
	"github.com/stretchr/testify/assert"
)

// {{structName}} represents the consumer client
type {{structName}} struct {
	BaseURL string
}

// New{{structName}} creates a new consumer client
func New{{structName}}(baseURL string) *{{structName}} {
	return &{{structName}}{
		BaseURL: baseURL,
	}
}

{{#each tests}}
func Test{{testFuncName}}(t *testing.T) {
	// Create Pact connecting to local daemon
	pact, err := consumer.NewV2Pact(consumer.MockHTTPProviderConfig{
		Consumer: "{{../consumer}}",
		Provider: "{{../provider}}",
		Host:     "127.0.0.1",
		Port:     1234,
	})
	if err != nil {
		t.Fatal(err)
	}
	defer pact.Wait()

	// Set up interaction
	err = pact.
		AddInteraction().
		Given("{{scenario.given}}").
		UponReceiving("{{description}}").
		WithRequest(dsl.Request{
			Method: "{{requestMethod}}",
			Path:   matchers.String("{{request.path}}"),
			{{#if request.headers}}
			Headers: dsl.MapMatcher{
				{{#each request.headers}}
				"{{@key}}": matchers.String("{{this}}"),
				{{/each}}
			},
			{{/if}}
			{{#if request.body}}
			Body: {{goStruct request.body}},
			{{/if}}
		}).
		WillRespondWith(dsl.Response{
			Status: {{response.status}},
			{{#if response.headers}}
			Headers: dsl.MapMatcher{
				{{#each response.headers}}
				"{{@key}}": matchers.String("{{this}}"),
				{{/each}}
			},
			{{/if}}
			{{#if response.body}}
			Body: {{goStruct response.body}},
			{{/if}}
		}).
		ExecuteTest(t, func(config consumer.MockServerConfig) error {
			// Arrange
			client := New{{../structName}}(fmt.Sprintf("http://%s:%d", config.Host, config.Port))

			// Act
			{{#if hasRequestBody}}
			response, err := client.{{methodName}}({{goStruct request.body}})
			{{else}}
			response, err := client.{{methodName}}()
			{{/if}}

			// Assert
			if err != nil {
				return err
			}

			assert.Equal(t, {{response.status}}, response.StatusCode)
			{{#if response.body}}
			{{#if isSuccessResponse}}
			assert.NotNil(t, response.Body)
			{{else}}
			assert.Contains(t, response.Error, "error")
			{{/if}}
			{{/if}}

			return nil
		})

	if err != nil {
		t.Fatal(err)
	}
}

{{/each}}

{{#each uniqueMethods}}
// {{methodName}} makes a {{httpMethod}} request
func (c *{{../structName}}) {{methodName}}({{#if hasBody}}body interface{}{{/if}}) (*http.Response, error) {
	{{#if hasBody}}
	// TODO: Implement request with body
	// Convert body to JSON and make request
	{{else}}
	// TODO: Implement request without body
	{{/if}}
	
	req, err := http.NewRequest("{{httpMethod}}", c.BaseURL+"{{path}}", nil)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	return client.Do(req)
}

{{/each}}
`;

    const structName = this.toPascalCase(`${testSuite.consumer}Client`);
    const uniqueMethods = this.getUniqueMethods(testSuite.tests);
    
    const content = TemplateEngine.render(template, {
      structName,
      consumer: testSuite.consumer,
      provider: testSuite.provider,
      tests: testSuite.tests.map(test => ({
        ...test,
        testFuncName: this.toPascalCase(`${test.name}_Test`),
        requestMethod: test.request.method.toUpperCase(),
        methodName: this.toPascalCase(test.request.method),
        hasRequestBody: test.request.body !== undefined,
        isSuccessResponse: test.response.status < 400,
        goStruct: (obj: any) => this.toGoStruct(obj)
      })),
      uniqueMethods: uniqueMethods.map(method => ({
        methodName: this.toPascalCase(method.name),
        httpMethod: method.method.toUpperCase(),
        hasBody: method.hasBody,
        path: method.path
      }))
    });

    return {
      path: `consumer/${this.toSnakeCase(testSuite.consumer)}_consumer_test.go`,
      content,
      type: 'test',
      language: 'go',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `package provider

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"github.com/pact-foundation/pact-go/v2/provider"
	"github.com/pact-foundation/pact-go/v2/utils"
)

// {{structName}} represents the provider service
type {{structName}} struct {
	Port int
}

// New{{structName}} creates a new provider service
func New{{structName}}(port int) *{{structName}} {
	return &{{structName}}{
		Port: port,
	}
}

func TestProvider(t *testing.T) {
	// Create a test server
	go startServer()

	// Get the Pact files
	pactDir := "../pacts"
	pactFiles, err := filepath.Glob(fmt.Sprintf("%s/*.json", pactDir))
	if err != nil {
		t.Fatal(err)
	}

	// Verify provider against all pact files
	for _, pactFile := range pactFiles {
		verifier := provider.HTTPVerifier{}

		err = verifier.VerifyProvider(t, provider.VerifyRequest{
			ProviderBaseURL: "http://localhost:8080",
			PactURLs:        []string{pactFile},
			BrokerURL:       os.Getenv("PACT_BROKER_URL"),
			BrokerUsername:  os.Getenv("PACT_BROKER_USERNAME"),
			BrokerPassword:  os.Getenv("PACT_BROKER_PASSWORD"),
			StateHandlers: provider.StateHandlers{
				{{#each providerStates}}
				"{{state}}": {{stateHandler}},
				{{/each}}
			},
			RequestFilter: func(req *http.Request) {
				// Add any request filtering/modification here
			},
		})

		if err != nil {
			t.Fatal(err)
		}
	}
}

{{#each providerStates}}
// {{stateHandler}} sets up provider state: {{state}}
func {{stateHandler}}() error {
	// TODO: Implement provider state setup for {{state}}
	return nil
}

{{/each}}

func startServer() {
	mux := http.NewServeMux()
	
	{{#each uniquePaths}}
	mux.HandleFunc("{{path}}", {{handlerName}})
	{{/each}}

	server := &http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	server.ListenAndServe()
}

{{#each uniquePaths}}
func {{handlerName}}(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	{{#each methods}}
	case "{{method}}":
		// TODO: Implement {{method}} {{../path}}
		w.Header().Set("Content-Type", "application/json")
		{{#if isSuccessMethod}}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(\`{"success": true}\`))
		{{else}}
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(\`{"error": "Bad request"}\`))
		{{/if}}
	{{/each}}
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
		w.Write([]byte(\`{"error": "Method not allowed"}\`))
	}
}

{{/each}}
`;

    const structName = this.toPascalCase(`${testSuite.provider}Service`);
    const providerStates = Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean)));
    const uniquePaths = this.getUniquePaths(testSuite.tests);
    
    const content = TemplateEngine.render(template, {
      structName,
      provider: testSuite.provider,
      consumer: testSuite.consumer,
      providerStates: providerStates.map(state => ({
        state,
        stateHandler: this.toCamelCase(`setup_${state?.replace(/\s+/g, '_') || ''}`)
      })),
      uniquePaths: uniquePaths.map(pathInfo => ({
        path: pathInfo.path,
        handlerName: this.toCamelCase(`handle${pathInfo.path.replace(/[{}\/]/g, '_')}`),
        methods: pathInfo.methods.map(method => ({
          method: method.toUpperCase(),
          isSuccessMethod: true // Simplified for now
        }))
      }))
    });

    return {
      path: `provider/${this.toSnakeCase(testSuite.provider)}_provider_test.go`,
      content,
      type: 'test',
      language: 'go',
      description: 'Provider Pact verification tests'
    };
  }

  private generateConfigurationFiles(config: LanguageConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // .gitignore
    files.push({
      path: '.gitignore',
      content: `# Binaries for programs and plugins
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary, built with \`go test -c\`
*.test

# Output of the go coverage tool
*.out

# Dependency directories
vendor/

# Go workspace file
go.work

# IDE files
.vscode/
.idea/

# Pact files
pacts/
logs/
`,
      type: 'config',
      language: 'go',
      description: 'Git ignore file'
    });

    // Makefile
    files.push({
      path: 'Makefile',
      content: `.PHONY: test test-consumer test-provider build clean

# Variables
PACT_DIR = ./pacts
LOG_DIR = ./logs

# Default target
all: test

# Run all tests
test: test-consumer test-provider

# Run consumer tests
test-consumer:
	@echo "Running consumer tests..."
	go test -v ./consumer/...

# Run provider tests  
test-provider:
	@echo "Running provider tests..."
	go test -v ./provider/...

# Build the application
build:
	go build -o bin/app ./cmd/...

# Clean build artifacts
clean:
	rm -rf bin/ \$(PACT_DIR)/ \$(LOG_DIR)/

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run with coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Install pact CLI
install-pact:
	@echo "Installing Pact CLI..."
	@echo "Please visit: https://github.com/pact-foundation/pact-ruby-standalone/releases"
`,
      type: 'config',
      language: 'go',
      description: 'Makefile for build automation'
    });

    return files;
  }

  private generateModuleFiles(config: LanguageConfig, dependencies: Dependency[], projectName: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // go.mod
    const goModContent = `module ${this.toSnakeCase(projectName)}-pact-tests

go 1.21

require (
${dependencies.map(dep => `\t${dep.name} ${dep.version}`).join('\n')}
)
`;

    files.push({
      path: 'go.mod',
      content: goModContent,
      type: 'dependency',
      language: 'go',
      description: 'Go module file'
    });

    // main.go (optional example)
    files.push({
      path: 'cmd/main.go',
      content: `package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	
	fmt.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(\`{"status": "healthy"}\`))
}
`,
      type: 'config',
      language: 'go',
      description: 'Example main application'
    });

    return files;
  }

  private generateDependencies(config: LanguageConfig): Dependency[] {
    const baseDependencies: Dependency[] = [
      {
        name: 'github.com/pact-foundation/pact-go/v2',
        version: 'v2.0.2',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact Go implementation'
      },
      {
        name: 'github.com/stretchr/testify',
        version: 'v1.8.4',
        scope: 'test',
        manager: config.packageManager,
        description: 'Testify assertions and mocking'
      }
    ];

    // Add framework-specific dependencies
    switch (config.framework) {
      case 'ginkgo':
        baseDependencies.push(
          {
            name: 'github.com/onsi/ginkgo/v2',
            version: 'v2.11.0',
            scope: 'test',
            manager: config.packageManager,
            description: 'Ginkgo BDD testing framework'
          },
          {
            name: 'github.com/onsi/gomega',
            version: 'v1.27.8',
            scope: 'test',
            manager: config.packageManager,
            description: 'Gomega matcher library'
          }
        );
        break;
      case 'testify':
        // Already included above
        break;
      case 'testing':
        // Built into Go, no additional dependencies
        break;
    }

    // Add HTTP client libraries
    baseDependencies.push(
      {
        name: 'github.com/gorilla/mux',
        version: 'v1.8.0',
        scope: 'production',
        manager: config.packageManager,
        description: 'Gorilla Mux HTTP router'
      }
    );

    return baseDependencies;
  }

  private generateProjectStructure(projectName: string): ProjectStructure {
    return {
      rootDir: '.',
      testDir: '.',
      configFiles: ['go.mod', 'Makefile', '.gitignore'],
      sourceFiles: ['consumer', 'provider', 'cmd'],
      packageFile: 'go.mod',
      buildFile: 'Makefile'
    };
  }

  private generateProjectConfiguration(config: LanguageConfig): ProjectConfiguration {
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      buildTool: 'go-build',
      language: 'go',
      version: '1.21',
      scripts: {
        test: 'go test ./...',
        'test:consumer': 'go test ./consumer/...',
        'test:provider': 'go test ./provider/...',
        build: 'go build ./...',
        'mod:tidy': 'go mod tidy',
        'mod:download': 'go mod download'
      },
      settings: {
        goVersion: '1.21',
        modulePath: `${this.toSnakeCase(config.language)}-pact-tests`
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig): string[] {
    return [
      '# Go Pact Testing Setup',
      '',
      '## Prerequisites',
      '- Go 1.21 or higher',
      '- Pact CLI tools (for verification)',
      '- Make (optional, for build automation)',
      '',
      '## Installation',
      '1. Ensure Go is installed: `go version`',
      '2. Download dependencies: `go mod download`',
      '3. Tidy modules: `go mod tidy`',
      '4. Run tests: `go test ./...`',
      '',
      '## Using Makefile (Recommended)',
      '- Run consumer tests: `make test-consumer`',
      '- Run provider tests: `make test-provider`',
      '- Build application: `make build`',
      '- Clean artifacts: `make clean`',
      '',
      '## Configuration',
      '- Set PACT_BROKER_URL environment variable',
      '- Configure provider state handlers',
      '- Update server port if needed',
      '',
      '## Running Tests',
      '- Consumer tests generate Pact files in pacts/ directory',
      '- Provider tests verify against Pact files',
      '- Use state handlers for provider state setup',
      '',
      `## Framework: ${config.framework}`,
      '- Supports concurrent testing',
      '- Built-in HTTP client and server',
      '- Comprehensive assertion methods',
      '- Native JSON marshaling/unmarshaling'
    ];
  }

  getSupportedFrameworks(): string[] {
    return ['testing', 'ginkgo', 'testify'];
  }

  getSupportedPackageManagers(): string[] {
    return ['go-mod'];
  }

  getFeatures(): string[] {
    return [
      'Native HTTP Support',
      'Concurrent Testing',
      'JSON Marshaling',
      'Provider State Management',
      'Message Pact Support',
      'Pact Broker Integration',
      'Contract Verification',
      'Built-in Testing Framework'
    ];
  }

  private getUniqueMethods(tests: TestCase[]) {
    const methods = new Map();
    tests.forEach(test => {
      const key = `${test.request.method}_${test.request.path}`;
      if (!methods.has(key)) {
        methods.set(key, {
          name: test.request.method,
          method: test.request.method,
          path: test.request.path,
          hasBody: test.request.body !== undefined
        });
      }
    });
    return Array.from(methods.values());
  }

  private getUniquePaths(tests: TestCase[]) {
    const paths = new Map();
    tests.forEach(test => {
      const path = test.request.path;
      if (!paths.has(path)) {
        paths.set(path, {
          path,
          methods: []
        });
      }
      const pathInfo = paths.get(path);
      if (!pathInfo.methods.includes(test.request.method)) {
        pathInfo.methods.push(test.request.method);
      }
    });
    return Array.from(paths.values());
  }

  private toGoStruct(obj: any): string {
    // Simplified Go struct generation
    if (typeof obj === 'string') {
      return `"${obj}"`;
    }
    if (typeof obj === 'number') {
      return obj.toString();
    }
    if (typeof obj === 'boolean') {
      return obj.toString();
    }
    if (Array.isArray(obj)) {
      return `[]interface{}{${obj.map(item => this.toGoStruct(item)).join(', ')}}`;
    }
    if (typeof obj === 'object' && obj !== null) {
      const fields = Object.entries(obj)
        .map(([key, value]) => `"${key}": ${this.toGoStruct(value)}`)
        .join(', ');
      return `map[string]interface{}{${fields}}`;
    }
    return 'nil';
  }
}