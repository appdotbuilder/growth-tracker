import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type CreateIntegrationInput } from '../schema';
import { createIntegration } from '../handlers/create_integration';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateIntegrationInput = {
  name: 'Test HRIS Integration',
  type: 'HRIS',
  enabled: true,
  config: JSON.stringify({
    apiUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    syncInterval: 3600
  })
};

describe('createIntegration', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an integration with all fields', async () => {
    const result = await createIntegration(testInput);

    // Verify all fields are set correctly
    expect(result.name).toEqual('Test HRIS Integration');
    expect(result.type).toEqual('HRIS');
    expect(result.enabled).toEqual(true);
    expect(result.config).toEqual(testInput.config);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save integration to database', async () => {
    const result = await createIntegration(testInput);

    // Query database to verify integration was saved
    const integrations = await db.select()
      .from(integrationsTable)
      .where(eq(integrationsTable.id, result.id))
      .execute();

    expect(integrations).toHaveLength(1);
    expect(integrations[0].name).toEqual('Test HRIS Integration');
    expect(integrations[0].type).toEqual('HRIS');
    expect(integrations[0].enabled).toEqual(true);
    expect(integrations[0].config).toEqual(testInput.config);
    expect(integrations[0].created_at).toBeInstanceOf(Date);
    expect(integrations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create integration with enabled set to false', async () => {
    const inputDisabled: CreateIntegrationInput = {
      name: 'Disabled Integration',
      type: 'Learning_Management',
      enabled: false,
      config: JSON.stringify({ endpoint: 'https://lms.example.com' })
    };

    const result = await createIntegration(inputDisabled);

    expect(result.name).toEqual('Disabled Integration');
    expect(result.type).toEqual('Learning_Management');
    expect(result.enabled).toEqual(false);
    expect(result.config).toEqual(inputDisabled.config);
  });

  it('should handle different integration types', async () => {
    const testCases = [
      { type: 'HRIS' as const, name: 'HR System Integration' },
      { type: 'Learning_Management' as const, name: 'LMS Integration' },
      { type: 'Performance_Review' as const, name: 'Performance System' },
      { type: 'Calendar' as const, name: 'Calendar Integration' },
      { type: 'Communication' as const, name: 'Chat Integration' }
    ];

    for (const testCase of testCases) {
      const input: CreateIntegrationInput = {
        name: testCase.name,
        type: testCase.type,
        enabled: true,
        config: JSON.stringify({ testConfig: true })
      };

      const result = await createIntegration(input);

      expect(result.name).toEqual(testCase.name);
      expect(result.type).toEqual(testCase.type);
      expect(result.enabled).toEqual(true);
    }
  });

  it('should store complex JSON configuration', async () => {
    const complexConfig = {
      authentication: {
        type: 'oauth2',
        clientId: 'client123',
        clientSecret: 'secret456',
        tokenUrl: 'https://auth.example.com/token'
      },
      endpoints: {
        users: 'https://api.example.com/users',
        departments: 'https://api.example.com/departments'
      },
      syncSettings: {
        interval: 3600,
        batchSize: 100,
        retryAttempts: 3
      },
      fieldMapping: {
        'employee_id': 'id',
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email': 'emailAddress'
      }
    };

    const input: CreateIntegrationInput = {
      name: 'Complex HRIS Integration',
      type: 'HRIS',
      enabled: false,
      config: JSON.stringify(complexConfig)
    };

    const result = await createIntegration(input);

    expect(result.config).toEqual(JSON.stringify(complexConfig));
    
    // Verify we can parse the stored config back
    const parsedConfig = JSON.parse(result.config);
    expect(parsedConfig.authentication.type).toEqual('oauth2');
    expect(parsedConfig.endpoints.users).toEqual('https://api.example.com/users');
    expect(parsedConfig.syncSettings.interval).toEqual(3600);
    expect(parsedConfig.fieldMapping.email).toEqual('emailAddress');
  });

  it('should create multiple integrations with unique IDs', async () => {
    const input1: CreateIntegrationInput = {
      name: 'First Integration',
      type: 'HRIS',
      enabled: true,
      config: JSON.stringify({ config: 'first' })
    };

    const input2: CreateIntegrationInput = {
      name: 'Second Integration',
      type: 'Calendar',
      enabled: false,
      config: JSON.stringify({ config: 'second' })
    };

    const result1 = await createIntegration(input1);
    const result2 = await createIntegration(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('First Integration');
    expect(result2.name).toEqual('Second Integration');
    expect(result1.type).toEqual('HRIS');
    expect(result2.type).toEqual('Calendar');
    expect(result1.enabled).toEqual(true);
    expect(result2.enabled).toEqual(false);
  });
});