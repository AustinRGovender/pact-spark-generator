
import { SupportedLanguage, TestFramework, GeneratedFile, TestSuite, LanguageConfig } from '../types/testModels';

export interface TemplateContext {
  testSuite: TestSuite;
  config: LanguageConfig;
  helpers: TemplateHelpers;
}

export interface TemplateHelpers {
  formatVariableName: (name: string) => string;
  formatClassName: (name: string) => string;
  formatMethodName: (name: string) => string;
  formatImports: (imports: string[]) => string;
  formatDependencies: (deps: any[]) => string;
  indent: (text: string, level: number) => string;
  camelCase: (text: string) => string;
  pascalCase: (text: string) => string;
  snakeCase: (text: string) => string;
  kebabCase: (text: string) => string;
}

export class TemplateEngine {
  private templates: Map<string, string> = new Map();
  private helpers: TemplateHelpers;

  constructor() {
    this.helpers = this.createHelpers();
    this.loadDefaultTemplates();
  }

  private createHelpers(): TemplateHelpers {
    return {
      formatVariableName: (name: string) => this.toCamelCase(name),
      formatClassName: (name: string) => this.toPascalCase(name),
      formatMethodName: (name: string) => this.toCamelCase(name),
      formatImports: (imports: string[]) => imports.map(imp => `import ${imp}`).join('\n'),
      formatDependencies: (deps: any[]) => JSON.stringify(deps, null, 2),
      indent: (text: string, level: number) => {
        const spaces = '  '.repeat(level);
        return text.split('\n').map(line => line ? spaces + line : line).join('\n');
      },
      camelCase: (text: string) => this.toCamelCase(text),
      pascalCase: (text: string) => this.toPascalCase(text),
      snakeCase: (text: string) => this.toSnakeCase(text),
      kebabCase: (text: string) => this.toKebabCase(text)
    };
  }

  private loadDefaultTemplates(): void {
    // JavaScript templates
    this.registerTemplate('javascript/consumer', this.getJavaScriptConsumerTemplate());
    this.registerTemplate('javascript/provider', this.getJavaScriptProviderTemplate());
    this.registerTemplate('javascript/package', this.getJavaScriptPackageTemplate());
    
    // Java templates
    this.registerTemplate('java/consumer', this.getJavaConsumerTemplate());
    this.registerTemplate('java/provider', this.getJavaProviderTemplate());
    this.registerTemplate('java/pom', this.getJavaPomTemplate());
    
    // C# templates
    this.registerTemplate('csharp/consumer', this.getCSharpConsumerTemplate());
    this.registerTemplate('csharp/provider', this.getCSharpProviderTemplate());
    this.registerTemplate('csharp/project', this.getCSharpProjectTemplate());
    
    // Python templates
    this.registerTemplate('python/consumer', this.getPythonConsumerTemplate());
    this.registerTemplate('python/provider', this.getPythonProviderTemplate());
    this.registerTemplate('python/requirements', this.getPythonRequirementsTemplate());
    
    // Go templates
    this.registerTemplate('go/consumer', this.getGoConsumerTemplate());
    this.registerTemplate('go/provider', this.getGoProviderTemplate());
    this.registerTemplate('go/mod', this.getGoModTemplate());
  }

  registerTemplate(key: string, template: string): void {
    this.templates.set(key, template);
  }

  render(templateKey: string, context: TemplateContext): string {
    const template = this.templates.get(templateKey);
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    return this.processTemplate(template, context);
  }

  static render(template: string, context: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getNestedValue(context, key.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private processTemplate(template: string, context: TemplateContext): string {
    let result = template;
    
    // Replace variables
    result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return this.getContextValue(varName, context) || match;
    });
    
    // Process conditionals
    result = this.processConditionals(result, context);
    
    // Process loops
    result = this.processLoops(result, context);
    
    return result;
  }

  private processConditionals(template: string, context: TemplateContext): string {
    return template.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = this.getContextValue(condition, context);
      return value ? content : '';
    });
  }

  private processLoops(template: string, context: TemplateContext): string {
    return template.replace(/\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayName, content) => {
      const array = this.getContextValue(arrayName, context);
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        return content.replace(/\{\{this\.(\w+)\}\}/g, (itemMatch, prop) => {
          return item[prop] || itemMatch;
        });
      }).join('');
    });
  }

  private getContextValue(varName: string, context: TemplateContext): any {
    const parts = varName.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  // Utility methods for string formatting
  private toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
  }

  private toPascalCase(str: string): string {
    const camelCase = this.toCamelCase(str);
    return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private toKebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  }

  // Template definitions
  private getJavaScriptConsumerTemplate(): string {
    return `const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('{{testSuite.name}} - Consumer Test', () => {
  const provider = new Pact({
    consumer: '{{testSuite.consumer}}',
    provider: '{{testSuite.provider}}',
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'info'
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  {{#each testSuite.tests}}
  describe('{{this.name}}', () => {
    it('{{this.description}}', async () => {
      await provider
        .given('{{this.scenario.given}}')
        .uponReceiving('{{this.scenario.when}}')
        .withRequest({
          method: '{{this.request.method}}',
          path: '{{this.request.path}}'{{#if this.request.body}},
          body: {{this.request.body}}{{/if}}{{#if this.request.headers}},
          headers: {{this.request.headers}}{{/if}}
        })
        .willRespondWith({
          status: {{this.response.status}},
          headers: {{this.response.headers}},
          body: {{this.response.body}}
        });

      // Add your consumer code here
    });
  });
  {{/each}}
});`;
  }

  private getJavaScriptProviderTemplate(): string {
    return `const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

describe('{{testSuite.name}} - Provider Verification', () => {
  it('should validate the expectations of {{testSuite.consumer}}', () => {
    const opts = {
      provider: '{{testSuite.provider}}',
      providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:3000',
      pactUrls: [
        path.resolve(process.cwd(), 'pacts', '{{helpers.kebabCase testSuite.consumer}}-{{helpers.kebabCase testSuite.provider}}.json')
      ],
      stateHandlers: {
        {{#each testSuite.tests}}
        '{{this.scenario.given}}': () => {
          console.log('Setting up state: {{this.scenario.given}}');
          return Promise.resolve('State setup complete');
        },{{/each}}
      }
    };

    return new Verifier(opts).verifyProvider();
  });
});`;
  }

  private getJavaScriptPackageTemplate(): string {
    return `{
  "name": "{{helpers.kebabCase testSuite.name}}-pact-tests",
  "version": "1.0.0",
  "description": "Pact tests for {{testSuite.name}}",
  "scripts": {
    "test": "jest",
    "test:consumer": "jest --testPathPattern=consumer",
    "test:provider": "jest --testPathPattern=provider"
  },
  "devDependencies": {
    "@pact-foundation/pact": "^12.0.0",
    "jest": "^29.0.0"
  }
}`;
  }

  private getJavaConsumerTemplate(): string {
    return `package {{config.customSettings.packageName}};

import au.com.dius.pact.consumer.dsl.PactDslWithProvider;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.RequestResponsePact;
import au.com.dius.pact.core.model.annotations.Pact;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "{{testSuite.provider}}", port = "8080")
class {{helpers.pascalCase testSuite.name}}ConsumerTest {

    {{#each testSuite.tests}}
    @Pact(consumer = "{{../testSuite.consumer}}")
    public RequestResponsePact {{helpers.camelCase this.name}}Pact(PactDslWithProvider builder) {
        return builder
            .given("{{this.scenario.given}}")
            .uponReceiving("{{this.scenario.when}}")
            .path("{{this.request.path}}")
            .method("{{this.request.method}}")
            {{#if this.request.body}}.body("{{this.request.body}}"){{/if}}
            .willRespondWith()
            .status({{this.response.status}})
            {{#if this.response.body}}.body("{{this.response.body}}"){{/if}}
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "{{helpers.camelCase this.name}}Pact")
    void {{helpers.camelCase this.name}}Test() {
        // Add your consumer test logic here
    }
    {{/each}}
}`;
  }

  private getJavaProviderTemplate(): string {
    return `package {{config.customSettings.packageName}};

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.State;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;

@Provider("{{testSuite.provider}}")
@PactFolder("pacts")
class {{helpers.pascalCase testSuite.name}}ProviderTest {

    @BeforeEach
    void before(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", 8080));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        context.verifyInteraction();
    }

    {{#each testSuite.tests}}
    @State("{{this.scenario.given}}")
    void {{helpers.camelCase this.scenario.given}}State() {
        // Set up provider state for: {{this.scenario.given}}
    }
    {{/each}}
}`;
  }

  private getJavaPomTemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <groupId>{{config.customSettings.groupId}}</groupId>
    <artifactId>{{helpers.kebabCase testSuite.name}}-pact-tests</artifactId>
    <version>1.0.0</version>
    
    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <pact.version>4.6.0</pact.version>
        <junit.version>5.9.0</junit.version>
    </properties>
    
    <dependencies>
        <dependency>
            <groupId>au.com.dius.pact.consumer</groupId>
            <artifactId>junit5</artifactId>
            <version>\${pact.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>au.com.dius.pact.provider</groupId>
            <artifactId>junit5</artifactId>
            <version>\${pact.version}</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>\${junit.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>`;
  }

  private getCSharpConsumerTemplate(): string {
    return `using PactNet;
using PactNet.Matchers;
using Xunit;

namespace {{config.customSettings.namespace}}
{
    public class {{helpers.pascalCase testSuite.name}}ConsumerTests
    {
        private readonly IPactBuilderV3 _pactBuilder;

        public {{helpers.pascalCase testSuite.name}}ConsumerTests()
        {
            var pact = Pact.V3("{{testSuite.consumer}}", "{{testSuite.provider}}", new PactConfig());
            _pactBuilder = pact.WithHttpInteractions();
        }

        {{#each testSuite.tests}}
        [Fact]
        public async Task {{helpers.pascalCase this.name}}_Test()
        {
            _pactBuilder
                .Given("{{this.scenario.given}}")
                .UponReceiving("{{this.scenario.when}}")
                .WithRequest(HttpMethod.{{this.request.method}}, "{{this.request.path}}")
                {{#if this.request.body}}.WithJsonBody({{this.request.body}}){{/if}}
                .WillRespondWith()
                .WithStatus({{this.response.status}})
                {{#if this.response.body}}.WithJsonBody({{this.response.body}}){{/if}};

            await _pactBuilder.VerifyAsync(async ctx =>
            {
                // Add your consumer test logic here
            });
        }
        {{/each}}
    }
}`;
  }

  private getCSharpProviderTemplate(): string {
    return `using PactNet.Verifier;
using Xunit;

namespace {{config.customSettings.namespace}}
{
    public class {{helpers.pascalCase testSuite.name}}ProviderTests
    {
        [Fact]
        public void EnsureProviderApiHonoursPactWithConsumer()
        {
            var config = new PactVerifierConfig();
            
            new PactVerifier(config)
                .ServiceProvider("{{testSuite.provider}}", "http://localhost:5000")
                .WithFileSource(new FileInfo("pacts/{{helpers.kebabCase testSuite.consumer}}-{{helpers.kebabCase testSuite.provider}}.json"))
                {{#each testSuite.tests}}.WithProviderStateUrl(new Uri("http://localhost:5000/provider-states")){{/each}}
                .Verify();
        }
    }
}`;
  }

  private getCSharpProjectTemplate(): string {
    return `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net6.0</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="PactNet" Version="4.6.0" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.3.2" />
    <PackageReference Include="xunit" Version="2.4.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.4.3" />
  </ItemGroup>
</Project>`;
  }

  private getPythonConsumerTemplate(): string {
    return `import pytest
from pact import Consumer, Provider

pact = Consumer('{{testSuite.consumer}}').has_pact_with(Provider('{{testSuite.provider}}'))

class Test{{helpers.pascalCase testSuite.name}}Consumer:
    
    def setup_method(self):
        pact.start()

    def teardown_method(self):
        pact.stop()

    {{#each testSuite.tests}}
    def test_{{helpers.snakeCase this.name}}(self):
        (pact
         .given('{{this.scenario.given}}')
         .upon_receiving('{{this.scenario.when}}')
         .with_request('{{this.request.method}}', '{{this.request.path}}'{{#if this.request.body}}, body={{this.request.body}}{{/if}})
         .will_respond_with({{this.response.status}}{{#if this.response.body}}, body={{this.response.body}}{{/if}}))

        with pact:
            # Add your consumer test logic here
            pass
    {{/each}}`;
  }

  private getPythonProviderTemplate(): string {
    return `import pytest
from pact import Verifier

class Test{{helpers.pascalCase testSuite.name}}Provider:
    
    def test_provider_honors_pact(self):
        verifier = Verifier(provider='{{testSuite.provider}}',
                          provider_base_url='http://localhost:5000')
        
        output, logs = verifier.verify_pacts('pacts/{{helpers.snakeCase testSuite.consumer}}-{{helpers.snakeCase testSuite.provider}}.json',
                                           provider_states_setup_url='http://localhost:5000/provider-states')
        
        assert output == 0`;
  }

  private getPythonRequirementsTemplate(): string {
    return `pact-python==2.2.0
pytest==7.4.0
requests==2.31.0`;
  }

  private getGoConsumerTemplate(): string {
    return `package main

import (
    "fmt"
    "log"
    "testing"
    "github.com/pact-foundation/pact-go/dsl"
)

func Test{{helpers.pascalCase testSuite.name}}Consumer(t *testing.T) {
    pact := dsl.Pact{
        Consumer: "{{testSuite.consumer}}",
        Provider: "{{testSuite.provider}}",
    }
    defer pact.Teardown()

    {{#each testSuite.tests}}
    t.Run("{{this.name}}", func(t *testing.T) {
        pact.
            Given("{{this.scenario.given}}").
            UponReceiving("{{this.scenario.when}}").
            WithRequest(dsl.Request{
                Method: "{{this.request.method}}",
                Path:   dsl.String("{{this.request.path}}"),
                {{#if this.request.body}}Body:   {{this.request.body}},{{/if}}
            }).
            WillRespondWith(dsl.Response{
                Status: {{this.response.status}},
                {{#if this.response.body}}Body:   {{this.response.body}},{{/if}}
            })

        err := pact.Verify(func() error {
            // Add your consumer test logic here
            return nil
        })

        if err != nil {
            t.Fatalf("Error on Verify: %v", err)
        }
    })
    {{/each}}
}`;
  }

  private getGoProviderTemplate(): string {
    return `package main

import (
    "fmt"
    "os"
    "testing"
    "github.com/pact-foundation/pact-go/dsl"
    "github.com/pact-foundation/pact-go/types"
)

func TestProvider(t *testing.T) {
    go startInstrumentedProvider()

    pact := dsl.Pact{}
    
    _, err := pact.VerifyProvider(t, types.VerifyRequest{
        ProviderBaseURL: "http://localhost:8080",
        PactURLs:        []string{"./pacts/{{helpers.kebabCase testSuite.consumer}}-{{helpers.kebabCase testSuite.provider}}.json"},
        {{#each testSuite.tests}}StateHandlers: types.StateHandlers{
            "{{this.scenario.given}}": func() error {
                // Set up provider state for: {{this.scenario.given}}
                return nil
            },
        },{{/each}}
    })

    if err != nil {
        t.Fatal(err)
    }
}

func startInstrumentedProvider() {
    // Start your provider server here
}`;
  }

  private getGoModTemplate(): string {
    return `module {{helpers.kebabCase testSuite.name}}-pact-tests

go 1.19

require (
    github.com/pact-foundation/pact-go v1.7.0
)`;
  }
}
