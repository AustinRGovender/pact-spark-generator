import React, { useState } from 'react';
import { Search, CheckCircle, XCircle, ExternalLink, Copy, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SyntaxHighlighter } from '@/components/SyntaxHighlighter';
import { LANGUAGE_METADATA, SupportedLanguage, LanguageFeatures } from '@/types/languageTypes';
import { LanguageGeneratorFactory } from '@/generators/LanguageGeneratorFactory';

const Languages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage | null>(null);

  const filteredLanguages = Object.entries(LANGUAGE_METADATA).filter(([key, metadata]) =>
    metadata.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    metadata.supportedFrameworks.some(framework => 
      framework.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getFeatureIcon = (hasFeature: boolean) => 
    hasFeature ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-muted-foreground" />
    );

  const getLanguageIcon = (icon: string) => (
    <span className="text-2xl">{icon}</span>
  );

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const sampleCode = {
    javascript: `// Jest + Pact example
const { PactV3 } = require('@pact-foundation/pact');

const provider = new PactV3({
  consumer: 'UserService',
  provider: 'ProductAPI'
});

describe('Product API Contract', () => {
  test('should return product details', async () => {
    await provider
      .given('product exists')
      .uponReceiving('a request for product details')
      .withRequest({
        method: 'GET',
        path: '/products/123'
      })
      .willRespondWith({
        status: 200,
        body: {
          id: 123,
          name: 'Example Product'
        }
      });

    await provider.executeTest(async (mockService) => {
      // Test implementation
    });
  });
});`,
    java: `// JUnit 5 + Pact example
@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "ProductAPI")
class ProductAPIContractTest {

    @Pact(consumer = "UserService")
    public RequestResponsePact productDetailsPact(PactDslWithProvider builder) {
        return builder
            .given("product exists")
            .uponReceiving("a request for product details")
            .path("/products/123")
            .method("GET")
            .willRespondWith()
            .status(200)
            .body(LambdaDsl.newJsonBody(o -> 
                o.numberType("id", 123)
                 .stringType("name", "Example Product")
            ).build())
            .toPact();
    }

    @Test
    @PactTestFor(pactMethod = "productDetailsPact")
    void testProductDetails(MockServer mockServer) {
        // Test implementation
    }
}`,
    csharp: `// NUnit + PactNet example
[TestFixture]
public class ProductAPIContractTest
{
    private IPactBuilderV3 _pactBuilder;

    [OneTimeSetUp]
    public void Setup()
    {
        _pactBuilder = Pact.V3("UserService", "ProductAPI", 
            new PactConfig());
    }

    [Test]
    public async Task GetProductDetails_ShouldReturnProduct()
    {
        _pactBuilder
            .Given("product exists")
            .UponReceiving("a request for product details")
            .WithRequest(HttpMethod.Get, "/products/123")
            .WillRespond()
            .WithStatus(HttpStatusCode.OK)
            .WithJsonBody(new
            {
                id = Match.Type(123),
                name = Match.Type("Example Product")
            });

        await _pactBuilder.VerifyAsync(async ctx =>
        {
            // Test implementation
        });
    }
}`,
    python: `# pytest + Pact example
import pytest
from pact import Consumer, Provider, Like

pact = Consumer('UserService').has_pact_with(Provider('ProductAPI'))

@pytest.fixture
def consumer_pact():
    pact.start_service()
    yield pact
    pact.stop_service()

def test_get_product_details(consumer_pact):
    (consumer_pact
     .given('product exists')
     .upon_receiving('a request for product details')
     .with_request('GET', '/products/123')
     .will_respond_with(200, body={
         'id': Like(123),
         'name': Like('Example Product')
     }))

    with consumer_pact:
        # Test implementation
        pass`,
    go: `// Go testing + Pact example
package main

import (
    "testing"
    "github.com/pact-foundation/pact-go/dsl"
)

func TestProductAPI(t *testing.T) {
    pact := &dsl.Pact{
        Consumer: "UserService",
        Provider: "ProductAPI",
    }

    defer pact.Teardown()

    pact.
        Given("product exists").
        UponReceiving("a request for product details").
        WithRequest(dsl.Request{
            Method: "GET",
            Path:   dsl.String("/products/123"),
        }).
        WillRespondWith(dsl.Response{
            Status: 200,
            Body: map[string]interface{}{
                "id":   dsl.Like(123),
                "name": dsl.Like("Example Product"),
            },
        })

    err := pact.Verify(func() error {
        // Test implementation
        return nil
    })

    if err != nil {
        t.Fatal(err)
    }
}`
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Supported Languages & Frameworks
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Generate contract tests for any of these languages with their respective testing frameworks and package managers.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search languages or frameworks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Language Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredLanguages.map(([key, metadata]) => {
            const languageKey = key as SupportedLanguage;
            const capabilities = LanguageGeneratorFactory.getGeneratorCapabilities(languageKey);
            
            return (
              <Card 
                key={key} 
                className="glass-panel hover:shadow-colored transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedLanguage(languageKey)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getLanguageIcon(metadata.icon)}
                      <CardTitle className="text-xl">{metadata.displayName}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a 
                        href={metadata.documentation} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                  <CardDescription>
                    Default: {metadata.defaultFramework} + {metadata.defaultPackageManager}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Frameworks */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Testing Frameworks</h4>
                    <div className="flex flex-wrap gap-1">
                      {metadata.supportedFrameworks.map((framework) => (
                        <Badge 
                          key={framework} 
                          variant="secondary" 
                          className="text-xs"
                        >
                          {framework}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Package Managers */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Package Managers</h4>
                    <div className="flex flex-wrap gap-1">
                      {metadata.supportedPackageManagers.map((manager) => (
                        <Badge 
                          key={manager} 
                          variant="outline" 
                          className="text-xs"
                        >
                          {manager}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Key Features</h4>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex items-center space-x-1">
                        {getFeatureIcon(metadata.features.supportsAsync)}
                        <span>Async Support</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {getFeatureIcon(metadata.features.hasGenerics)}
                        <span>Generics</span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLanguage(languageKey);
                    }}
                  >
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Feature Comparison Matrix */}
        <Card className="glass-panel mb-12">
          <CardHeader>
            <CardTitle>Feature Comparison Matrix</CardTitle>
            <CardDescription>
              Compare language features across all supported platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Language</th>
                    <th className="text-center py-2 px-4">Async</th>
                    <th className="text-center py-2 px-4">Null Safety</th>
                    <th className="text-center py-2 px-4">Generics</th>
                    <th className="text-center py-2 px-4">Lambdas</th>
                    <th className="text-center py-2 px-4">Annotations</th>
                    <th className="text-center py-2 px-4">Interfaces</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(LANGUAGE_METADATA).map(([key, metadata]) => (
                    <tr key={key} className="border-b">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center space-x-2">
                          {getLanguageIcon(metadata.icon)}
                          <span>{metadata.displayName}</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.supportsAsync)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.hasNullSafety)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.hasGenerics)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.hasLambdas)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.hasAnnotations)}
                      </td>
                      <td className="text-center py-3 px-4">
                        {getFeatureIcon(metadata.features.hasInterfaces)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Code Examples */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Code Examples</CardTitle>
            <CardDescription>
              Sample contract test implementations for each language
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(sampleCode).map(([lang, code]) => {
                const metadata = LANGUAGE_METADATA[lang as SupportedLanguage];
                return (
                  <div key={lang} className="border rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted/50 border-b">
                      <div className="flex items-center space-x-3">
                        {getLanguageIcon(metadata.icon)}
                        <h3 className="font-semibold">{metadata.displayName}</h3>
                        <Badge variant="secondary">{metadata.defaultFramework}</Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-0">
                      <SyntaxHighlighter
                        code={code}
                        language={lang === 'csharp' ? 'csharp' : lang}
                        showLineNumbers={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Get Started CTA */}
        <div className="text-center mt-12">
          <Card className="glass-panel inline-block">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Generate Tests?</h3>
              <p className="text-muted-foreground mb-6">
                Choose your preferred language and start generating contract tests from your OpenAPI specifications.
              </p>
              <Button size="lg" asChild>
                <a href="/">
                  Start Generating <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Languages;