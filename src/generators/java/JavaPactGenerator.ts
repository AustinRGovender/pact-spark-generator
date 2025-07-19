import { LanguageGenerator } from '../../utils/languageGenerator';
import { TestSuite, TestCase } from '../../types/testModels';
import { LanguageConfig, GeneratedOutput, GeneratedFile, Dependency, ProjectStructure, ProjectConfiguration } from '../../types/languageTypes';
import { TemplateEngine } from '../../utils/templateEngine';

export class JavaPactGenerator extends LanguageGenerator {
  constructor() {
    super('java');
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
    
    // Generate build files
    files.push(...this.generateBuildFiles(config, dependencies));

    return {
      files,
      projectStructure,
      setupInstructions: this.generateSetupInstructions(config),
      dependencies,
      configuration: projectConfig
    };
  }

  private generateConsumerTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `package {{packageName}};

import au.com.dius.pact.consumer.dsl.PactDslWithProvider;
import au.com.dius.pact.consumer.junit5.PactConsumerTestExt;
import au.com.dius.pact.consumer.junit5.PactTestFor;
import au.com.dius.pact.core.model.RequestResponsePact;
import au.com.dius.pact.core.model.annotations.Pact;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(PactConsumerTestExt.class)
@SpringJUnitConfig
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
public class {{className}} {

{{#each tests}}
    @Pact(provider = "{{../provider}}", consumer = "{{../consumer}}")
    public RequestResponsePact {{methodName}}(PactDslWithProvider builder) {
        return builder
            .given("{{scenario.given}}")
            .uponReceiving("{{description}}")
            .path("{{request.path}}")
            .method("{{request.method}}")
            {{#if request.headers}}
            {{#each request.headers}}
            .headers("{{@key}}", "{{this}}")
            {{/each}}
            {{/if}}
            {{#if request.body}}
            .body("{{json request.body}}")
            {{/if}}
            .willRespondWith()
            .status({{response.status}})
            {{#if response.headers}}
            {{#each response.headers}}
            .headers("{{@key}}", "{{this}}")
            {{/each}}
            {{/if}}
            {{#if response.body}}
            .body("{{json response.body}}")
            {{/if}}
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "{{methodName}}")
    public void {{testMethodName}}() {
        // Test implementation
        // TODO: Add your test logic here
        assertTrue(true, "{{description}}");
    }

{{/each}}
}`;

    const className = this.toPascalCase(`${testSuite.consumer}Test`);
    const packageName = `com.example.${this.toCamelCase(testSuite.name)}.consumer`;
    
    const content = TemplateEngine.render(template, {
      packageName,
      className,
      provider: testSuite.provider,
      consumer: testSuite.consumer,
      tests: testSuite.tests.map(test => ({
        ...test,
        methodName: this.toCamelCase(`${test.name}Pact`),
        testMethodName: this.toCamelCase(`test${this.toPascalCase(test.name)}`)
      }))
    });

    return {
      path: `src/test/java/${packageName.replace(/\./g, '/')}/consumer/${className}.java`,
      content,
      type: 'test',
      language: 'java',
      description: 'Consumer Pact tests'
    };
  }

  private generateProviderTest(testSuite: TestSuite, config: LanguageConfig): GeneratedFile {
    const template = `package {{packageName}};

import au.com.dius.pact.provider.junit5.HttpTestTarget;
import au.com.dius.pact.provider.junit5.PactVerificationContext;
import au.com.dius.pact.provider.junit5.PactVerificationInvocationContextProvider;
import au.com.dius.pact.provider.junitsupport.Provider;
import au.com.dius.pact.provider.junitsupport.loader.PactFolder;
import au.com.dius.pact.provider.spring.SpringRestPactRunner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.TestTemplate;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

@SpringJUnitConfig
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Provider("{{provider}}")
@PactFolder("src/test/resources/pacts")
public class {{className}} {

    @LocalServerPort
    private int port;

    @BeforeEach
    void setUp(PactVerificationContext context) {
        context.setTarget(new HttpTestTarget("localhost", port));
    }

    @TestTemplate
    @ExtendWith(PactVerificationInvocationContextProvider.class)
    void pactVerificationTestTemplate(PactVerificationContext context) {
        context.verifyInteraction();
    }

{{#each tests}}
    {{#if providerState}}
    @State("{{providerState}}")
    public void {{stateMethodName}}() {
        // TODO: Set up provider state for {{providerState}}
    }
    {{/if}}
{{/each}}
}`;

    const className = this.toPascalCase(`${testSuite.provider}ProviderTest`);
    const packageName = `com.example.${this.toCamelCase(testSuite.name)}.provider`;
    
    const content = TemplateEngine.render(template, {
      packageName,
      className,
      provider: testSuite.provider,
      tests: testSuite.tests
        .filter(test => test.providerState)
        .map(test => ({
          ...test,
          stateMethodName: this.toCamelCase(`setup${this.toPascalCase(test.providerState || '')}`)
        }))
    });

    return {
      path: `src/test/java/${packageName.replace(/\./g, '/')}/provider/${className}.java`,
      content,
      type: 'test',
      language: 'java',
      description: 'Provider Pact verification tests'
    };
  }

  private generateConfigurationFiles(config: LanguageConfig): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Application properties for tests
    files.push({
      path: 'src/test/resources/application-test.properties',
      content: `# Test configuration
logging.level.au.com.dius.pact=DEBUG
pact.verifier.publishResults=false
pact.provider.version=1.0.0
`,
      type: 'config',
      language: 'java',
      description: 'Test application properties'
    });

    // Logback configuration
    files.push({
      path: 'src/test/resources/logback-test.xml',
      content: `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>
    
    <logger name="au.com.dius.pact" level="DEBUG"/>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>`,
      type: 'config',
      language: 'java',
      description: 'Logback test configuration'
    });

    return files;
  }

  private generateBuildFiles(config: LanguageConfig, dependencies: Dependency[]): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    if (config.packageManager === 'maven') {
      files.push(this.generateMavenPom(dependencies));
    } else if (config.packageManager === 'gradle') {
      files.push(this.generateGradleBuild(dependencies));
    }

    return files;
  }

  private generateMavenPom(dependencies: Dependency[]): GeneratedFile {
    const template = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>pact-tests</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <pact.version>{{pactVersion}}</pact.version>
        <junit.version>5.9.2</junit.version>
        <spring.boot.version>3.0.4</spring.boot.version>
    </properties>

    <dependencies>
{{#each dependencies}}
        <dependency>
            <groupId>{{groupId}}</groupId>
            <artifactId>{{name}}</artifactId>
            <version>{{version}}</version>
            {{#if scope}}
            <scope>{{scope}}</scope>
            {{/if}}
        </dependency>
{{/each}}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <version>\${spring.boot.version}</version>
            </plugin>
            
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>3.0.0-M9</version>
                <configuration>
                    <includes>
                        <include>**/*Test.java</include>
                    </includes>
                </configuration>
            </plugin>
            
            <plugin>
                <groupId>au.com.dius.pact.provider</groupId>
                <artifactId>maven</artifactId>
                <version>\${pact.version}</version>
                <configuration>
                    <pactDirectory>target/pacts</pactDirectory>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>`;

    const mavenDependencies = dependencies.map(dep => ({
      ...dep,
      groupId: this.getMavenGroupId(dep.name)
    }));

    const content = TemplateEngine.render(template, {
      pactVersion: '4.5.5',
      dependencies: mavenDependencies
    });

    return {
      path: 'pom.xml',
      content,
      type: 'build',
      language: 'java',
      description: 'Maven build configuration'
    };
  }

  private generateGradleBuild(dependencies: Dependency[]): GeneratedFile {
    const template = `plugins {
    id 'java'
    id 'org.springframework.boot' version '3.0.4'
    id 'io.spring.dependency-management' version '1.1.0'
    id 'au.com.dius.pact' version '{{pactVersion}}'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
{{#each dependencies}}
    {{scope}} '{{name}}:{{version}}'
{{/each}}
}

test {
    useJUnitPlatform()
    systemProperty 'pact.rootDir', '\${project.buildDir}/pacts'
}

pact {
    serviceProviders {
        // Provider configuration will be added here
    }
}`;

    const content = TemplateEngine.render(template, {
      pactVersion: '4.5.5',
      dependencies: dependencies.map(dep => ({
        ...dep,
        scope: dep.scope === 'test' ? 'testImplementation' : 'implementation'
      }))
    });

    return {
      path: 'build.gradle',
      content,
      type: 'build',
      language: 'java',
      description: 'Gradle build configuration'
    };
  }

  private generateDependencies(config: LanguageConfig): Dependency[] {
    const baseDependencies: Dependency[] = [
      {
        name: 'au.com.dius.pact.consumer:junit5',
        version: '4.5.5',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact JVM consumer JUnit 5 support'
      },
      {
        name: 'au.com.dius.pact.provider:junit5',
        version: '4.5.5',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact JVM provider JUnit 5 support'
      },
      {
        name: 'au.com.dius.pact.provider:spring',
        version: '4.5.5',
        scope: 'test',
        manager: config.packageManager,
        description: 'Pact JVM Spring support'
      }
    ];

    // Add framework-specific dependencies
    if (config.framework === 'junit5') {
      baseDependencies.push(
        {
          name: 'org.junit.jupiter:junit-jupiter-engine',
          version: '5.9.2',
          scope: 'test',
          manager: config.packageManager,
          description: 'JUnit 5 Jupiter Engine'
        },
        {
          name: 'org.junit.jupiter:junit-jupiter-api',
          version: '5.9.2',
          scope: 'test',
          manager: config.packageManager,
          description: 'JUnit 5 Jupiter API'
        }
      );
    }

    // Add Spring Boot dependencies
    baseDependencies.push(
      {
        name: 'org.springframework.boot:spring-boot-starter-test',
        version: '3.0.4',
        scope: 'test',
        manager: config.packageManager,
        description: 'Spring Boot Test Starter'
      },
      {
        name: 'org.springframework.boot:spring-boot-starter-web',
        version: '3.0.4',
        scope: 'production',
        manager: config.packageManager,
        description: 'Spring Boot Web Starter'
      }
    );

    return baseDependencies;
  }

  private generateProjectStructure(projectName: string): ProjectStructure {
    return {
      rootDir: '.',
      testDir: 'src/test/java',
      configFiles: ['src/test/resources/application-test.properties', 'src/test/resources/logback-test.xml'],
      sourceFiles: ['src/main/java'],
      packageFile: 'pom.xml',
      buildFile: 'pom.xml'
    };
  }

  private generateProjectConfiguration(config: LanguageConfig): ProjectConfiguration {
    return {
      packageManager: config.packageManager,
      testFramework: config.framework,
      buildTool: config.packageManager === 'maven' ? 'maven' : 'gradle',
      language: 'java',
      version: '17',
      scripts: {
        test: config.packageManager === 'maven' ? 'mvn test' : 'gradle test',
        build: config.packageManager === 'maven' ? 'mvn compile' : 'gradle build',
        'pact:verify': config.packageManager === 'maven' ? 'mvn pact:verify' : 'gradle pactVerify'
      },
      settings: {
        sourceCompatibility: '17',
        targetCompatibility: '17',
        encoding: 'UTF-8'
      }
    };
  }

  private generateSetupInstructions(config: LanguageConfig): string[] {
    const instructions = [
      '# Java Pact Testing Setup',
      '',
      '## Prerequisites',
      '- Java 17 or higher',
      `- ${config.packageManager === 'maven' ? 'Maven 3.6+' : 'Gradle 7.0+'}`,
      '- Spring Boot 3.0+ (optional, for Spring integration)',
      '',
      '## Installation',
    ];

    if (config.packageManager === 'maven') {
      instructions.push(
        '1. Ensure Maven is installed: `mvn --version`',
        '2. Run tests: `mvn test`',
        '3. Verify provider contracts: `mvn pact:verify`'
      );
    } else {
      instructions.push(
        '1. Ensure Gradle is installed: `gradle --version`',
        '2. Run tests: `gradle test`',
        '3. Verify provider contracts: `gradle pactVerify`'
      );
    }

    instructions.push(
      '',
      '## Configuration',
      '- Update application-test.properties with your settings',
      '- Configure provider verification in your build file',
      '- Set up Pact Broker integration if needed',
      '',
      '## Running Tests',
      '- Consumer tests generate Pact files',
      '- Provider tests verify against Pact files',
      '- Use @State annotations for provider state setup'
    );

    return instructions;
  }

  getSupportedFrameworks(): string[] {
    return ['junit5', 'junit4', 'testng', 'spock'];
  }

  getSupportedPackageManagers(): string[] {
    return ['maven', 'gradle'];
  }

  getFeatures(): string[] {
    return [
      'Spring Boot Integration',
      'JUnit 5 Support',
      'Provider State Management',
      'Message Pact Support',
      'Pact Broker Integration',
      'Contract Verification',
      'Mock Provider Setup'
    ];
  }

  private getMavenGroupId(artifactId: string): string {
    const groupMappings: Record<string, string> = {
      'au.com.dius.pact.consumer:junit5': 'au.com.dius.pact.consumer',
      'au.com.dius.pact.provider:junit5': 'au.com.dius.pact.provider',
      'au.com.dius.pact.provider:spring': 'au.com.dius.pact.provider',
      'org.junit.jupiter:junit-jupiter-engine': 'org.junit.jupiter',
      'org.junit.jupiter:junit-jupiter-api': 'org.junit.jupiter',
      'org.springframework.boot:spring-boot-starter-test': 'org.springframework.boot',
      'org.springframework.boot:spring-boot-starter-web': 'org.springframework.boot'
    };

    return groupMappings[artifactId] || artifactId.split(':')[0];
  }
}