import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type CreateIntegrationInput, type UpdateIntegrationInput } from '../schema';
import { updateIntegration } from '../handlers/update_integration';
import { eq } from 'drizzle-orm';

// Helper function to create a test integration
const createTestIntegration = async (overrides: Partial<CreateIntegrationInput> = {}) => {
  const defaultInput: CreateIntegrationInput = {
    name: 'Test Integration',
    type: 'HRIS',
    enabled: false,
    config: '{"api_key": "test123", "url": "https://api.test.com"}'
  };

  const input = { ...defaultInput, ...overrides };

  const result = await db.insert(integrationsTable)
    .values(input)
    .returning()
    .execute();

  return result[0];
};

describe('updateIntegration', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update integration name', async () => {
    // Create test integration
    const integration = await createTestIntegration();

    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      name: 'Updated Integration Name'
    };

    const result = await updateIntegration(updateInput);

    expect(result.id).toEqual(integration.id);
    expect(result.name).toEqual('Updated Integration Name');
    expect(result.type).toEqual(integration.type);
    expect(result.enabled).toEqual(integration.enabled);
    expect(result.config).toEqual(integration.config);
    expect(result.created_at).toEqual(integration.created_at);
    expect(result.updated_at).not.toEqual(integration.updated_at);
  });

  it('should update integration enabled status', async () => {
    // Create test integration with enabled = false
    const integration = await createTestIntegration({ enabled: false });

    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      enabled: true
    };

    const result = await updateIntegration(updateInput);

    expect(result.id).toEqual(integration.id);
    expect(result.name).toEqual(integration.name);
    expect(result.enabled).toEqual(true);
    expect(result.updated_at).not.toEqual(integration.updated_at);
  });

  it('should update integration config', async () => {
    // Create test integration
    const integration = await createTestIntegration();

    const newConfig = '{"api_key": "updated123", "url": "https://api.updated.com", "timeout": 30}';
    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      config: newConfig
    };

    const result = await updateIntegration(updateInput);

    expect(result.id).toEqual(integration.id);
    expect(result.name).toEqual(integration.name);
    expect(result.config).toEqual(newConfig);
    expect(result.updated_at).not.toEqual(integration.updated_at);
  });

  it('should update multiple fields at once', async () => {
    // Create test integration
    const integration = await createTestIntegration({
      name: 'Original Name',
      enabled: false,
      config: '{"original": "config"}'
    });

    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      name: 'Multi-Update Integration',
      enabled: true,
      config: '{"updated": "config", "multi": true}'
    };

    const result = await updateIntegration(updateInput);

    expect(result.id).toEqual(integration.id);
    expect(result.name).toEqual('Multi-Update Integration');
    expect(result.enabled).toEqual(true);
    expect(result.config).toEqual('{"updated": "config", "multi": true}');
    expect(result.type).toEqual(integration.type);
    expect(result.created_at).toEqual(integration.created_at);
    expect(result.updated_at).not.toEqual(integration.updated_at);
  });

  it('should save updated integration to database', async () => {
    // Create test integration
    const integration = await createTestIntegration();

    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      name: 'Database Update Test',
      enabled: true
    };

    const result = await updateIntegration(updateInput);

    // Verify in database
    const dbIntegrations = await db.select()
      .from(integrationsTable)
      .where(eq(integrationsTable.id, integration.id))
      .execute();

    expect(dbIntegrations).toHaveLength(1);
    expect(dbIntegrations[0].name).toEqual('Database Update Test');
    expect(dbIntegrations[0].enabled).toEqual(true);
    expect(dbIntegrations[0].updated_at).toEqual(result.updated_at);
  });

  it('should handle partial updates correctly', async () => {
    // Create test integration
    const integration = await createTestIntegration({
      name: 'Partial Test',
      enabled: true,
      config: '{"keep": "this"}'
    });

    // Update only name
    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      name: 'Only Name Updated'
    };

    const result = await updateIntegration(updateInput);

    // Verify only name was updated, other fields remain unchanged
    expect(result.name).toEqual('Only Name Updated');
    expect(result.enabled).toEqual(true);
    expect(result.config).toEqual('{"keep": "this"}');
    expect(result.type).toEqual(integration.type);
  });

  it('should throw error when integration does not exist', async () => {
    const updateInput: UpdateIntegrationInput = {
      id: 99999, // Non-existent ID
      name: 'Non-existent Integration'
    };

    await expect(updateIntegration(updateInput)).rejects.toThrow(/Integration with id 99999 not found/i);
  });

  it('should handle empty config update', async () => {
    // Create test integration
    const integration = await createTestIntegration();

    const updateInput: UpdateIntegrationInput = {
      id: integration.id,
      config: '{}'
    };

    const result = await updateIntegration(updateInput);

    expect(result.config).toEqual('{}');
    expect(result.name).toEqual(integration.name);
    expect(result.enabled).toEqual(integration.enabled);
  });

  it('should update different integration types', async () => {
    // Create integrations of different types
    const hrIntegration = await createTestIntegration({
      name: 'HR System',
      type: 'HRIS'
    });

    const lmsIntegration = await createTestIntegration({
      name: 'Learning System',
      type: 'Learning_Management'
    });

    // Update both
    await updateIntegration({
      id: hrIntegration.id,
      name: 'Updated HR System',
      enabled: true
    });

    await updateIntegration({
      id: lmsIntegration.id,
      name: 'Updated Learning System',
      enabled: true
    });

    // Verify both were updated correctly
    const updatedHR = await db.select()
      .from(integrationsTable)
      .where(eq(integrationsTable.id, hrIntegration.id))
      .execute();

    const updatedLMS = await db.select()
      .from(integrationsTable)
      .where(eq(integrationsTable.id, lmsIntegration.id))
      .execute();

    expect(updatedHR[0].name).toEqual('Updated HR System');
    expect(updatedHR[0].type).toEqual('HRIS');
    expect(updatedHR[0].enabled).toEqual(true);

    expect(updatedLMS[0].name).toEqual('Updated Learning System');
    expect(updatedLMS[0].type).toEqual('Learning_Management');
    expect(updatedLMS[0].enabled).toEqual(true);
  });
});