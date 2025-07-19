import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';
import { TemplateEngine } from '../../utils/templateEngine';

export class PythonPactGenerator extends LanguageGenerator {
  constructor() {
    super('python');
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
    
    // Generate setup files
    files.push(...this.generateSetupFiles(config, dependencies, testSuite.name));

    return {
      files,
      projectStructure,
      setupInstructions: this.generateSetupInstructions(config),
      dependencies,
      configuration: projectConfig
    };
  }

  private generateConsumerTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `import json
import pytest
import requests
from pact import Consumer, Provider
from pact.verify import Verifier


class Test{{className}}:
    """Consumer Pact tests for {{consumer}}"""

    def setup_method(self):
        """Set up test fixtures"""
        self.pact = Consumer('{{consumer}}').has_pact_with(Provider('{{provider}}'))
        self.mock_uri = 'http://localhost:1234'

{{#each tests}}
    def {{testMethodName}}(self):
        """{{description}}"""
        # Arrange
        expected_response = {{pythonDict response.body}}
        
        (self.pact
         .given('{{scenario.given}}')
         .upon_receiving('{{description}}')
         .with_request(
             method='{{request.method}}',
             path='{{request.path}}',
             {{#if request.headers}}
             headers={{pythonDict request.headers}},
             {{/if}}
             {{#if request.body}}
             body={{pythonDict request.body}},
             {{/if}}
         )
         .will_respond_with(
             status={{response.status}},
             {{#if response.headers}}
             headers={{pythonDict response.headers}},
             {{/if}}
             {{#if response.body}}
             body=expected_response
             {{/if}}
         ))

        # Act
        with self.pact:
            {{#if hasRequestBody}}
            response = requests.{{request.method}}(
                f'{self.mock_uri}{{request.path}}',
                headers={{pythonDict request.headers}},
                json={{pythonDict request.body}}
            )
            {{else}}
            response = requests.{{request.method}}(
                f'{self.mock_uri}{{request.path}}',
                {{#if request.headers}}
                headers={{pythonDict request.headers}}
                {{/if}}
            )
            {{/if}}

        # Assert
        assert response.status_code == {{response.status}}
        {{#if response.body}}
        {{#if isSuccessResponse}}
        assert response.json() == expected_response
        {{else}}
        assert 'error' in response.json()
        {{/if}}
        {{/if}}

{{/each}}

    def teardown_method(self):
        """Clean up after tests"""
        self.pact.stop()
`;

    const className = this.toPascalCase(`${testSuite.consumer}Consumer`);
    
    const content = TemplateEngine.render(template, {
      className,
      consumer: testSuite.consumer,
      provider: testSuite.provider,
      tests: testSuite.tests.map(test => ({
        ...test,
        testMethodName: this.toSnakeCase(`test_${test.name}`),
        hasRequestBody: test.request.body !== undefined,
        isSuccessResponse: test.response.status < 400,
        pythonDict: (obj: any) => this.toPythonDict(obj)
      }))
    });

    return {
      path: `tests/consumer/test_${this.toSnakeCase(testSuite.consumer)}_consumer.py`,
      content,
      type: 'test',
      language: 'python',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `import pytest
from pact.verifier import Verifier
from your_app import create_app  # Import your Flask/FastAPI app


class Test{{className}}:
    """Provider Pact verification tests for {{provider}}"""

    @classmethod
    def setup_class(cls):
        """Set up test class"""
        cls.app = create_app()
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()

    def test_against_consumer_pacts(self):
        """Verify provider against consumer pacts"""
        verifier = Verifier(
            provider='{{provider}}',
            provider_base_url='http://localhost:5000',
        )

        # Add provider states
        {{#each providerStates}}
        verifier.add_provider_state('{{this}}', self.{{stateMethod}})
        {{/each}}

        # Verify pacts
        success, logs = verifier.verify_pacts(
            './pacts/{{consumer}}-{{provider}}.json',
            verbose=True,
            provider_app_version='1.0.0',
            publish_verification_results=False
        )

        assert success, f"Pact verification failed: {logs}"

{{#each providerStates}}
    def {{stateMethod}}(self, params=None):
        """Set up provider state: {{this}}"""
        # TODO: Implement provider state setup for {{this}}
        pass

{{/each}}

    @pytest.fixture(autouse=True)
    def setup_provider_states(self):
        """Set up provider states before each test"""
        # Add any common setup here
        yield
        # Add any cleanup here
`;

    const className = this.toPascalCase(`${testSuite.provider}Provider`);
    const providerStates = Array.from(new Set(testSuite.tests.map(t => t.providerState).filter(Boolean)));
    
    const content = TemplateEngine.render(template, {
      className,
      provider: testSuite.provider,
      consumer: testSuite.consumer,
      providerStates: providerStates.map(state => ({
        state,
        stateMethod: this.toSnakeCase(`setup_${state?.replace(/\s+/g, '_') || ''}`)
      }))
    });

    return {
      path: `tests/provider/test_${this.toSnakeCase(testSuite.provider)}_provider.py`,
      content,
      type: 'test',
      language: 'python',
      description: 'Provider Pact verification tests'
    };
  }

  private generateConfigurationFiles(config: LanguageConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // pytest.ini
    files.push({
      path: 'pytest.ini',
      content: `[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --tb=short
    --strict-markers
markers =
    consumer: Consumer pact tests
    provider: Provider pact tests
    integration: Integration tests
`,
      type: 'config',
      language: 'python',
      description: 'Pytest configuration'
    });

    // conftest.py
    files.push({
      path: 'tests/conftest.py',
      content: `import pytest
from pact import Consumer, Provider


@pytest.fixture(scope="session")
def consumer():
    """Consumer fixture for pact tests"""
    return Consumer('TestConsumer')


@pytest.fixture(scope="session") 
def provider():
    """Provider fixture for pact tests"""
    return Provider('TestProvider')


@pytest.fixture(scope="session")
def pact(consumer, provider):
    """Pact fixture for consumer tests"""
    pact = consumer.has_pact_with(provider)
    pact.start()
    yield pact
    pact.stop()


@pytest.fixture(autouse=True)
def setup_pact_logging():
    """Set up logging for pact tests"""
    import logging
    logging.basicConfig(level=logging.INFO)
`,
      type: 'config',
      language: 'python',
      description: 'Pytest configuration and fixtures'
    });

    // __init__.py files
    files.push(
      {
        path: 'tests/__init__.py',
        content: '"""Test package"""',
        type: 'config',
        language: 'python',
        description: 'Test package initialization'
      },
      {
        path: 'tests/consumer/__init__.py',
        content: '"""Consumer test package"""',
        type: 'config',
        language: 'python',
        description: 'Consumer test package initialization'
      },
      {
        path: 'tests/provider/__init__.py',
        content: '"""Provider test package"""',
        type: 'config',
        language: 'python',
        description: 'Provider test package initialization'
      }
    );

    return files;
  }

  private generateSetupFiles(config: LanguageConfig, dependencies: Dependency[], projectName: string): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // requirements.txt
    const requirementsContent = dependencies
      .map(dep => `${dep.name}${dep.version ? `==${dep.version}` : ''}`)
      .join('\n');

    files.push({
      path: 'requirements.txt',
      content: requirementsContent,
      type: 'dependency',
      language: 'python',
      description: 'Python dependencies'
    });

    // setup.py
    files.push({
      path: 'setup.py',
      content: `from setuptools import setup, find_packages

setup(
    name="${this.toSnakeCase(projectName)}_pact_tests",
    version="1.0.0",
    description="Pact tests for ${projectName}",
    packages=find_packages(),
    install_requires=[
        ${dependencies.map(dep => `"${dep.name}${dep.version ? `==${dep.version}` : ''}"`)
          .join(',\n        ')}
    ],
    extras_require={
        "dev": [
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0"
        ]
    },
    python_requires=">=3.8",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)`,
      type: 'build',
      language: 'python',
      description: 'Python package setup'
    });

    // pyproject.toml (modern Python)
    files.push({
      path: 'pyproject.toml',
      content: `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${this.toSnakeCase(projectName)}_pact_tests"
version = "1.0.0"
description = "Pact tests for ${projectName}"
readme = "README.md"
requires-python = ">=3.8"
dependencies = [
    ${dependencies.map(dep => `"${dep.name}${dep.version ? `==${dep.version}` : ''}"`)
      .join(',\n    ')}
]

[project.optional-dependencies]
dev = [
    "pytest-cov>=4.0.0",
    "black>=23.0.0",
    "flake8>=6.0.0",
    "mypy>=1.0.0"
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_classes = ["Test*"]
python_functions = ["test_*"]

[tool.black]
line-length = 88
target-version = ['py38']

[tool.mypy]
python_version = "3.8"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
`,
      type: 'config',
      language: 'python',
      description: 'Modern Python project configuration'
    });

    return files;
  }

  private generateDependencies(config: LanguageConfig): Dependency[] {
    const baseDependencies: Dependency[] = [
      {
        name: 'pact-python',
        version: '2.0.1',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact Python implementation'
      },
      {
        name: 'requests',
        version: '2.31.0',
        scope: 'test',
        manager: config.packageManager,
        description: 'HTTP library for Python'
      }
    ];

    // Add framework-specific dependencies
    switch (config.framework) {
      case 'pytest':
        baseDependencies.push(
          {
            name: 'pytest',
            version: '7.4.0',
            scope: 'test',
            manager: config.packageManager,
            description: 'Python testing framework'
          },
          {
            name: 'pytest-html',
            version: '3.2.0',
            scope: 'test',
            manager: config.packageManager,
            description: 'HTML report generation for pytest'
          }
        );
        break;
      case 'unittest':
        // unittest is built into Python, no additional dependencies needed
        break;
      case 'nose2':
        baseDependencies.push({
          name: 'nose2',
          version: '0.12.0',
          scope: 'test',
          manager: config.packageManager,
          description: 'Nose2 testing framework'
        });
        break;
    }

    // Add common development dependencies
    baseDependencies.push(
      {
        name: 'flask',
        version: '2.3.2',
        scope: 'production',
        manager: config.packageManager,
        description: 'Flask web framework (optional)'
      },
      {
        name: 'fastapi',
        version: '0.100.0',
        scope: 'production',
        manager: config.packageManager,
        description: 'FastAPI web framework (optional)'
      }
    );

    return baseDependencies;
  }

  private generateProjectStructure(projectName: string): ProjectStructure {
    return {
      rootDir: '.',
      testDir: 'tests',
      configFiles: ['pytest.ini', 'pyproject.toml', 'tests/conftest.py'],
      sourceFiles: ['tests/consumer', 'tests/provider'],
      packageFile: 'requirements.txt',
      buildFile: 'setup.py'
    };
  }

  private generateProjectConfiguration(config: LanguageConfig): ProjectConfiguration {
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      buildTool: 'setuptools',
      language: 'python',
      version: '3.8',
      scripts: {
        test: 'pytest',
        'test:coverage': 'pytest --cov',
        'test:consumer': 'pytest tests/consumer -m consumer',
        'test:provider': 'pytest tests/provider -m provider',
        install: config.packageManager === 'pip' ? 'pip install -r requirements.txt' : 'poetry install',
        lint: 'flake8 tests/',
        format: 'black tests/'
      },
      settings: {
        pythonVersion: '3.8',
        testFramework: config.framework,
        codeStyle: 'black'
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig): string[] {
    const instructions = [
      '# Python Pact Testing Setup',
      '',
      '## Prerequisites',
      '- Python 3.8 or higher',
      '- pip or poetry package manager',
      '- Virtual environment (recommended)',
      '',
      '## Installation',
    ];

    if (config.packageManager === 'pip') {
      instructions.push(
        '1. Create virtual environment: `python -m venv venv`',
        '2. Activate virtual environment:',
        '   - Windows: `venv\\Scripts\\activate`',
        '   - Unix/MacOS: `source venv/bin/activate`',
        '3. Install dependencies: `pip install -r requirements.txt`',
        '4. Run tests: `pytest`'
      );
    } else if (config.packageManager === 'poetry') {
      instructions.push(
        '1. Install Poetry: `pip install poetry`',
        '2. Install dependencies: `poetry install`',
        '3. Run tests: `poetry run pytest`'
      );
    }

    instructions.push(
      '',
      '## Configuration',
      '- Update pytest.ini for test configuration',
      '- Configure pact broker settings in conftest.py',
      '- Set up provider state handlers',
      '',
      '## Running Tests',
      '- Consumer tests: `pytest tests/consumer -m consumer`',
      '- Provider tests: `pytest tests/provider -m provider`',
      '- All tests: `pytest`',
      '- With coverage: `pytest --cov`',
      '',
      '## Project Structure',
      '- Consumer tests generate pact files',
      '- Provider tests verify against pact files',
      '- Use fixtures for test setup and teardown',
      '',
      `## Framework: ${config.framework}`,
      '- Supports async/await with asyncio',
      '- Built-in JSON serialization',
      '- Comprehensive assertion methods'
    );

    return instructions;
  }

  getSupportedFrameworks(): string[] {
    return ['pytest', 'unittest', 'nose2'];
  }

  getSupportedPackageManagers(): string[] {
    return ['pip', 'pipenv', 'poetry', 'conda'];
  }

  getFeatures(): string[] {
    return [
      'Flask/FastAPI Integration',
      'Async/Await Support',
      'JSON Serialization',
      'Provider State Management',
      'Message Pact Support',
      'Pact Broker Integration',
      'Contract Verification',
      'Type Hints Support'
    ];
  }

  private toPythonDict(obj: any): string {
    return JSON.stringify(obj, null, 4).replace(/"/g, "'");
  }
}