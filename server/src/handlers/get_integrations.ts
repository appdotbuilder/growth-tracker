import { db } from '../db';
import { integrationsTable } from '../db/schema';
import { type Integration } from '../schema';

export const getIntegrations = async (): Promise<Integration[]> => {
  try {
    // Fetch all integrations from the database
    const results = await db.select()
      .from(integrationsTable)
      .execute();

    // Return the integrations with proper date conversion
    return results.map(integration => ({
      ...integration,
      created_at: integration.created_at,
      updated_at: integration.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch integrations:', error);
    throw error;
  }
};