import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type CreateIntegrationInput } from '../schema';
import { getIntegrations } from '../handlers/get_integrations';

describe('getIntegrations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no integrations exist', async () => {
    const result = await getIntegrations();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all integrations', async () => {
    // Create test integrations
    const testIntegrations = [
      {
        name: 'HRIS System',
        type: 'HRIS' as const,
        enabled: true,
        config: JSON.stringify({ api_url: 'https://api.hris.com', api_key: 'secret123' })
      },
      {
        name: 'Learning Platform',
        type: 'Learning_Management' as const,
        enabled: false,
        config: JSON.stringify({ platform_url: 'https://learn.company.com', token: 'token456' })
      },
      {
        name: 'Performance Tool',
        type: 'Performance_Review' as const,
        enabled: true,
        config: JSON.stringify({ endpoint: 'https://perf.company.com/api' })
      }
    ];

    // Insert test integrations
    await db.insert(integrationsTable)
      .values(testIntegrations)
      .execute();

    const result = await getIntegrations();

    // Verify results
    expect(result).toHaveLength(3);
    expect(result.every(integration => integration.id)).toBe(true);
    expect(result.every(integration => integration.created_at instanceof Date)).toBe(true);
    expect(result.every(integration => integration.updated_at instanceof Date)).toBe(true);

    // Verify specific integration properties
    const hrisIntegration = result.find(i => i.name === 'HRIS System');
    expect(hrisIntegration).toBeDefined();
    expect(hrisIntegration!.type).toBe('HRIS');
    expect(hrisIntegration!.enabled).toBe(true);
    expect(hrisIntegration!.config).toBe(JSON.stringify({ api_url: 'https://api.hris.com', api_key: 'secret123' }));

    const learningIntegration = result.find(i => i.name === 'Learning Platform');
    expect(learningIntegration).toBeDefined();
    expect(learningIntegration!.type).toBe('Learning_Management');
    expect(learningIntegration!.enabled).toBe(false);
    expect(learningIntegration!.config).toBe(JSON.stringify({ platform_url: 'https://learn.company.com', token: 'token456' }));
  });

  it('should return integrations with all supported types', async () => {
    // Create integrations for each supported type
    const integrationTypes = ['HRIS', 'Learning_Management', 'Performance_Review', 'Calendar', 'Communication'] as const;
    
    const testIntegrations = integrationTypes.map((type, index) => ({
      name: `${type} Integration ${index + 1}`,
      type,
      enabled: index % 2 === 0, // Alternate enabled/disabled
      config: JSON.stringify({ test_config: `config_${index}` })
    }));

    await db.insert(integrationsTable)
      .values(testIntegrations)
      .execute();

    const result = await getIntegrations();

    expect(result).toHaveLength(5);
    
    // Verify all types are present
    const resultTypes = result.map(i => i.type).sort();
    expect(resultTypes).toEqual(['Calendar', 'Communication', 'HRIS', 'Learning_Management', 'Performance_Review']);
    
    // Verify enabled/disabled pattern
    result.forEach((integration, index) => {
      const originalIndex = integrationTypes.indexOf(integration.type);
      expect(integration.enabled).toBe(originalIndex % 2 === 0);
    });
  });



  it('should return integrations in database insertion order', async () => {
    const testIntegrations = [
      {
        name: 'First Integration',
        type: 'HRIS' as const,
        enabled: true,
        config: JSON.stringify({ order: 1 })
      },
      {
        name: 'Second Integration',
        type: 'Calendar' as const,
        enabled: false,
        config: JSON.stringify({ order: 2 })
      },
      {
        name: 'Third Integration',
        type: 'Communication' as const,
        enabled: true,
        config: JSON.stringify({ order: 3 })
      }
    ];

    // Insert integrations sequentially
    for (const integration of testIntegrations) {
      await db.insert(integrationsTable)
        .values(integration)
        .execute();
    }

    const result = await getIntegrations();

    expect(result).toHaveLength(3);
    
    // Verify order by checking IDs are sequential
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    
    // Verify names match expected order
    expect(result[0].name).toBe('First Integration');
    expect(result[1].name).toBe('Second Integration');
    expect(result[2].name).toBe('Third Integration');
  });

  it('should preserve config JSON strings as-is', async () => {
    const complexConfig = {
      api_settings: {
        base_url: 'https://api.example.com',
        version: 'v2',
        timeout: 30000
      },
      auth: {
        type: 'oauth2',
        client_id: 'test_client',
        scopes: ['read', 'write']
      },
      features: {
        enabled: ['sync', 'webhook'],
        disabled: ['batch_import']
      }
    };

    await db.insert(integrationsTable)
      .values({
        name: 'Complex Integration',
        type: 'Performance_Review',
        enabled: true,
        config: JSON.stringify(complexConfig)
      })
      .execute();

    const result = await getIntegrations();

    expect(result).toHaveLength(1);
    expect(result[0].config).toBe(JSON.stringify(complexConfig));
    
    // Verify config can be parsed back to original object
    const parsedConfig = JSON.parse(result[0].config);
    expect(parsedConfig).toEqual(complexConfig);
  });
});