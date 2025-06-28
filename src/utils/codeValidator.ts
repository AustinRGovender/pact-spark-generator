
export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
}

export class PactCodeValidator {
  static validatePactTest(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for common PactJS issues
      this.checkPactImports(line, lineNumber, errors);
      this.checkPactSetup(line, lineNumber, errors);
      this.checkInteractionStructure(line, lineNumber, errors);
      this.checkMatcherUsage(line, lineNumber, errors);
      this.checkProviderState(line, lineNumber, errors);
      this.checkResponseStructure(line, lineNumber, errors);
    });

    // Check overall structure
    this.checkOverallStructure(code, errors);

    return errors;
  }

  private static checkPactImports(line: string, lineNumber: number, errors: ValidationError[]) {
    if (line.includes('require(') && line.includes('pact')) {
      if (!line.includes('@pact-foundation/pact')) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: 'Consider using the official @pact-foundation/pact package',
          severity: 'warning',
          code: 'pact-import'
        });
      }
    }
  }

  private static checkPactSetup(line: string, lineNumber: number, errors: ValidationError[]) {
    if (line.includes('new Pact(') && !line.includes('consumer:') && !line.includes('provider:')) {
      errors.push({
        line: lineNumber,
        column: 1,
        message: 'Pact constructor should include consumer and provider names',
        severity: 'error',
        code: 'pact-setup'
      });
    }
  }

  private static checkInteractionStructure(line: string, lineNumber: number, errors: ValidationError[]) {
    if (line.includes('addInteraction(')) {
      if (!line.includes('uponReceiving') && !line.includes('withRequest') && !line.includes('willRespondWith')) {
        errors.push({
          line: lineNumber,
          column: 1,
          message: 'Interaction should include uponReceiving, withRequest, and willRespondWith',
          severity: 'warning',
          code: 'interaction-structure'
        });
      }
    }
  }

  private static checkMatcherUsage(line: string, lineNumber: number, errors: ValidationError[]) {
    // Check for hardcoded values that should use matchers
    if (line.includes('body:') && /:\s*"[^"]*"/.test(line) && !line.includes('like(') && !line.includes('term(')) {
      errors.push({
        line: lineNumber,
        column: 1,
        message: 'Consider using Pact matchers (like, term, eachLike) instead of hardcoded values',
        severity: 'info',
        code: 'matcher-suggestion'
      });
    }
  }

  private static checkProviderState(line: string, lineNumber: number, errors: ValidationError[]) {
    if (line.includes('state:') && line.includes('""')) {
      errors.push({
        line: lineNumber,
        column: 1,
        message: 'Provider state should have a meaningful description',
        severity: 'warning',
        code: 'provider-state'
      });
    }
  }

  private static checkResponseStructure(line: string, lineNumber: number, errors: ValidationError[]) {
    if (line.includes('willRespondWith:') && !line.includes('status:')) {
      errors.push({
        line: lineNumber,
        column: 1,
        message: 'Response should include a status code',
        severity: 'error',
        code: 'response-status'
      });
    }
  }

  private static checkOverallStructure(code: string, errors: ValidationError[]) {
    if (!code.includes('describe(') && !code.includes('it(')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'PactJS tests should be wrapped in describe/it blocks',
        severity: 'warning',
        code: 'test-structure'
      });
    }

    if (!code.includes('beforeAll') || !code.includes('afterAll')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Consider adding beforeAll/afterAll hooks for Pact setup and teardown',
        severity: 'info',
        code: 'lifecycle-hooks'
      });
    }

    if (!code.includes('provider.verify()')) {
      errors.push({
        line: 1,
        column: 1,
        message: 'Remember to call provider.verify() after each test',
        severity: 'warning',
        code: 'verify-call'
      });
    }
  }
}
