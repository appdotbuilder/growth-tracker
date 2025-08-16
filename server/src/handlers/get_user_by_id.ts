import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export const getUserById = async (id: number): Promise<User | null> => {
  try {
    // Query for the specific user
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const user = results[0];

    // Return the user with proper type conversion
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      department: user.department,
      manager_id: user.manager_id,
      profile_picture: user.profile_picture,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('Get user by ID failed:', error);
    throw error;
  }
};