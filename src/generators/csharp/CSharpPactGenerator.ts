import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';
import { TemplateEngine } from '../../utils/templateEngine';

export class CSharpPactGenerator extends LanguageGenerator {
  constructor() {
    super('csharp');
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
    
    // Generate project files
    files.push(...this.generateProjectFiles(config, dependencies, testSuite.name));

    return {
      files,
      projectStructure,
      setupInstructions: this.generateSetupInstructions(config),
      dependencies,
      configuration: projectConfig
    };
  }

  private generateConsumerTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;
using {{testFramework}};
using PactNet;
using PactNet.Mocks.MockHttpService;
using PactNet.Mocks.MockHttpService.Models;

namespace {{namespace}}.Consumer
{
    {{#if isNUnit}}
    [TestFixture]
    {{/if}}
    {{#if isXUnit}}
    public class {{className}} : IDisposable
    {{else}}
    public class {{className}}
    {{/if}}
    {
        private IPactBuilder _pactBuilder;
        private IMockProviderService _mockProviderService;
        private static readonly HttpClient HttpClient = new HttpClient();
        private string _mockServerUri = "http://localhost:9222";

        {{#if isNUnit}}
        [SetUp]
        {{/if}}
        {{#if isXUnit}}
        public {{className}}()
        {{else}}
        public void Setup()
        {{/if}}
        {
            _pactBuilder = new PactBuilder()
                .ServiceConsumer("{{consumer}}")
                .HasPactWith("{{provider}}");

            _mockProviderService = _pactBuilder.MockService(_mockServerUri);
        }

{{#each tests}}
        {{#if ../isNUnit}}
        [Test]
        {{/if}}
        {{#if ../isXUnit}}
        [Fact]
        {{/if}}
        {{#if ../isMSTest}}
        [TestMethod]
        {{/if}}
        public async Task {{testMethodName}}()
        {
            // Arrange
            _mockProviderService
                .Given("{{scenario.given}}")
                .UponReceiving("{{description}}")
                .With(new ProviderServiceRequest
                {
                    Method = HttpVerb.{{httpVerb}},
                    Path = "{{request.path}}",
                    {{#if request.headers}}
                    Headers = new Dictionary<string, object>
                    {
                        {{#each request.headers}}
                        { "{{@key}}", "{{this}}" }{{#unless @last}},{{/unless}}
                        {{/each}}
                    },
                    {{/if}}
                    {{#if request.body}}
                    Body = {{jsonBody request.body}}
                    {{/if}}
                })
                .WillRespondWith(new ProviderServiceResponse
                {
                    Status = {{response.status}},
                    {{#if response.headers}}
                    Headers = new Dictionary<string, object>
                    {
                        {{#each response.headers}}
                        { "{{@key}}", "{{this}}" }{{#unless @last}},{{/unless}}
                        {{/each}}
                    },
                    {{/if}}
                    {{#if response.body}}
                    Body = {{jsonBody response.body}}
                    {{/if}}
                });

            // Act
            var client = new HttpClient { BaseAddress = new Uri(_mockServerUri) };
            {{#if hasRequestBody}}
            var content = new StringContent({{jsonString request.body}}, Encoding.UTF8, "application/json");
            var response = await client.{{httpMethod}}Async("{{request.path}}", content);
            {{else}}
            var response = await client.{{httpMethod}}Async("{{request.path}}");
            {{/if}}

            // Assert
            {{#if ../isNUnit}}
            Assert.AreEqual({{response.status}}, (int)response.StatusCode);
            {{/if}}
            {{#if ../isXUnit}}
            Assert.Equal({{response.status}}, (int)response.StatusCode);
            {{/if}}
            {{#if ../isMSTest}}
            Assert.AreEqual({{response.status}}, (int)response.StatusCode);
            {{/if}}

            _mockProviderService.VerifyInteractions();
        }

{{/each}}

        {{#if isNUnit}}
        [TearDown]
        {{/if}}
        {{#if isXUnit}}
        public void Dispose()
        {{else}}
        public void TearDown()
        {{/if}}
        {
            _pactBuilder.Build();
        }
    }
}`;

    const className = this.toPascalCase(`${testSuite.consumer}ConsumerTests`);
    const namespace = this.toPascalCase(testSuite.name);
    
    const testFrameworkInfo = this.getTestFrameworkInfo(config.framework);
    
    const content = TemplateEngine.render(template, {
      namespace,
      className,
      consumer: testSuite.consumer,
      provider: testSuite.provider,
      testFramework: testFrameworkInfo.using,
      isNUnit: config.framework === 'nunit',
      isXUnit: config.framework === 'xunit',
      isMSTest: config.framework === 'mstest',
      tests: testSuite.tests.map(test => ({
        ...test,
        testMethodName: this.toPascalCase(`Test_${test.name}`),
        httpVerb: test.request.method.toUpperCase(),
        httpMethod: this.toPascalCase(test.request.method),
        hasRequestBody: test.request.body !== undefined,
        jsonBody: (obj: any) => JSON.stringify(obj, null, 4),
        jsonString: (obj: any) => JSON.stringify(JSON.stringify(obj))
      }))
    });

    return {
      path: `Consumer/${className}.cs`,
      content,
      type: 'test',
      language: 'csharp',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `using System;
using System.Collections.Generic;
using {{testFramework}};
using PactNet;
using PactNet.Infrastructure.Outputters;
using PactNet.Verifier;

namespace {{namespace}}.Provider
{
    {{#if isNUnit}}
    [TestFixture]
    {{/if}}
    public class {{className}}
    {
        private readonly string _serviceUri = "http://localhost:5000";
        private readonly string _pactPath = "../../../Consumer/pacts";

        {{#if isNUnit}}
        [Test]
        {{/if}}
        {{#if isXUnit}}
        [Fact]
        {{/if}}
        {{#if isMSTest}}
        [TestMethod]
        {{/if}}
        public void EnsureProviderApiHonoursPactWithConsumer()
        {
            // Arrange
            var config = new PactVerifierConfig
            {
                Outputters = new List<IOutput>
                {
                    new ConsoleOutput()
                },
                Verbose = true
            };

            // Act & Assert
            IPactVerifier pactVerifier = new PactVerifier(config);
            pactVerifier
                .ProviderState($"{_serviceUri}/provider-states")
                .ServiceProvider("{{provider}}", _serviceUri)
                .HonoursPactWith("{{consumer}}")
                .PactUri($"{_pactPath}/{{consumer}}-{{provider}}.json")
                .Verify();
        }

{{#each providerStates}}
        [HttpPost]
        [Route("provider-states")]
        public IActionResult ProviderStates([FromBody] ProviderState providerState)
        {
            switch (providerState.State)
            {
                {{#each ../tests}}
                {{#if providerState}}
                case "{{providerState}}":
                    {{stateSetupMethod}}();
                    break;
                {{/if}}
                {{/each}}
                default:
                    break;
            }

            return Ok();
        }

{{#each ../tests}}
        {{#if providerState}}
        private void {{stateSetupMethod}}()
        {
            // TODO: Set up provider state for {{providerState}}
        }
        {{/if}}
{{/each}}
{{/each}}
    }

    public class ProviderState
    {
        public string State { get; set; }
        public Dictionary<string, object> Params { get; set; }
    }
}`;

    const className = this.toPascalCase(`${testSuite.provider}ProviderTests`);
    const namespace = this.toPascalCase(testSuite.name);
    
    const testFrameworkInfo = this.getTestFrameworkInfo(config.framework);
    
    const content = TemplateEngine.render(template, {
      namespace,
      className,
      provider: testSuite.provider,
      consumer: testSuite.consumer,
      testFramework: testFrameworkInfo.using,
      isNUnit: config.framework === 'nunit',
      isXUnit: config.framework === 'xunit',
      isMSTest: config.framework === 'mstest',
      tests: testSuite.tests
        .filter(test => test.providerState)
        .map(test => ({
          ...test,
          stateSetupMethod: this.toPascalCase(`Setup${test.providerState?.replace(/\s+/g, '') || ''}`)
        })),
      providerStates: Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean)))
    });

    return {
      path: `Provider/${className}.cs`,
      content,
      type: 'test',
      language: 'csharp',
      description: 'Provider Pact verification tests'
    };
  }

  private generateConfigurationFiles(config: LanguageConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // appsettings.Test.json
    files.push({
      path: 'appsettings.Test.json',
      content: `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "PactNet": "Debug"
    }
  },
  "Pact": {
    "PublishResults": false,
    "ProviderVersion": "1.0.0",
    "BrokerUrl": "",
    "BrokerUsername": "",
    "BrokerPassword": ""
  }
}`,
      type: 'config',
      language: 'csharp',
      description: 'Test configuration settings'
    });

    return files;
  }

  private generateProjectFiles(config: LanguageConfig, dependencies: Dependency[], projectName: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // .csproj file
    const csprojTemplate = `<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
    <IsTestProject>true</IsTestProject>
  </PropertyGroup>

  <ItemGroup>
{{#each dependencies}}
    <PackageReference Include="{{name}}" Version="{{version}}" />
{{/each}}
  </ItemGroup>

  <ItemGroup>
    <None Update="appsettings.Test.json">
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
    </None>
  </ItemGroup>

</Project>`;

    const content = TemplateEngine.render(csprojTemplate, {
      dependencies: dependencies.filter(dep => dep.scope === 'test' || dep.scope === 'production')
    });

    files.push({
      path: `${this.toPascalCase(projectName)}.Tests.csproj`,
      content,
      type: 'build',
      language: 'csharp',
      description: 'C# project file'
    });

    // Global.json
    files.push({
      path: 'global.json',
      content: `{
  "sdk": {
    "version": "8.0.0",
    "rollForward": "latestMajor"
  }
}`,
      type: 'config',
      language: 'csharp',
      description: 'Global SDK configuration'
    });

    return files;
  }

  private generateDependencies(config: LanguageConfig): Dependency[] {
    const baseDependencies: Dependency[] = [
      {
        name: 'PactNet',
        version: '4.5.0',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact .NET implementation'
      },
      {
        name: 'Microsoft.AspNetCore.Mvc.Testing',
        version: '8.0.0',
        scope: 'test',
        manager: config.packageManager,
        description: 'ASP.NET Core testing framework'
      }
    ];

    // Add framework-specific dependencies
    switch (config.framework) {
      case 'nunit':
        baseDependencies.push(
          {
            name: 'NUnit',
            version: '3.13.3',
            scope: 'test',
            manager: config.packageManager,
            description: 'NUnit testing framework'
          },
          {
            name: 'NUnit3TestAdapter',
            version: '4.4.2',
            scope: 'test',
            manager: config.packageManager,
            description: 'NUnit test adapter'
          }
        );
        break;
      case 'xunit':
        baseDependencies.push(
          {
            name: 'xunit',
            version: '2.4.2',
            scope: 'test',
            manager: config.packageManager,
            description: 'xUnit testing framework'
          },
          {
            name: 'xunit.runner.visualstudio',
            version: '2.4.3',
            scope: 'test',
            manager: config.packageManager,
            description: 'xUnit Visual Studio runner'
          }
        );
        break;
      case 'mstest':
        baseDependencies.push(
          {
            name: 'MSTest.TestFramework',
            version: '3.0.2',
            scope: 'test',
            manager: config.packageManager,
            description: 'MSTest testing framework'
          },
          {
            name: 'MSTest.TestAdapter',
            version: '3.0.2',
            scope: 'test',
            manager: config.packageManager,
            description: 'MSTest test adapter'
          }
        );
        break;
    }

    // Add .NET runtime dependencies
    baseDependencies.push(
      {
        name: 'Microsoft.NET.Test.Sdk',
        version: '17.5.0',
        scope: 'test',
        manager: config.packageManager,
        description: '.NET Test SDK'
      }
    );

    return baseDependencies;
  }

  private generateProjectStructure(projectName: string): ProjectStructure {
    return {
      rootDir: '.',
      testDir: '.',
      configFiles: ['appsettings.Test.json', 'global.json'],
      sourceFiles: ['Consumer', 'Provider'],
      packageFile: `${this.toPascalCase(projectName)}.Tests.csproj`,
      buildFile: `${this.toPascalCase(projectName)}.Tests.csproj`
    };
  }

  private generateProjectConfiguration(config: LanguageConfig): ProjectConfiguration {
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      buildTool: 'dotnet',
      language: 'csharp',
      version: '8.0',
      scripts: {
        test: 'dotnet test',
        build: 'dotnet build',
        restore: 'dotnet restore'
      },
      settings: {
        targetFramework: 'net8.0',
        nullable: 'enable',
        implicitUsings: 'enable'
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig): string[] {
    return [
      '# C# Pact Testing Setup',
      '',
      '## Prerequisites',
      '- .NET 8.0 SDK or higher',
      '- Visual Studio 2022 or VS Code with C# extension',
      '',
      '## Installation',
      '1. Ensure .NET SDK is installed: `dotnet --version`',
      '2. Restore packages: `dotnet restore`',
      '3. Build project: `dotnet build`',
      '4. Run tests: `dotnet test`',
      '',
      '## Configuration',
      '- Update appsettings.Test.json with your settings',
      '- Configure Pact Broker integration if needed',
      '- Set up provider state endpoints',
      '',
      '## Running Tests',
      '- Consumer tests generate Pact files in pacts/ directory',
      '- Provider tests verify against Pact files',
      '- Use provider state endpoints for test setup',
      '',
      '## Framework Support',
      `- Using ${config.framework.toUpperCase()} testing framework`,
      '- Supports async/await patterns',
      '- Built-in JSON serialization support'
    ];
  }

  getSupportedFrameworks(): string[] {
    return ['nunit', 'xunit', 'mstest'];
  }

  getSupportedPackageManagers(): string[] {
    return ['nuget'];
  }

  getFeatures(): string[] {
    return [
      'ASP.NET Core Integration',
      'Async/Await Support',
      'JSON Serialization',
      'Provider State Management',
      'Message Pact Support',
      'Pact Broker Integration',
      'Contract Verification'
    ];
  }

  private getTestFrameworkInfo(framework: string) {
    const frameworks: Record<string, { using: string; attribute: string }> = {
      nunit: { using: 'NUnit.Framework', attribute: 'Test' },
      xunit: { using: 'Xunit', attribute: 'Fact' },
      mstest: { using: 'Microsoft.VisualStudio.TestTools.UnitTesting', attribute: 'TestMethod' }
    };

    return frameworks[framework] || frameworks.nunit;
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^|[-_\s])(\w)/g, (_, char) => char.toUpperCase());
  }
}