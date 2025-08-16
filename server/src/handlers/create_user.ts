import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const createUser = async (input: CreateUserInput): Promise<User> => {
  try {
    // Check if email already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      throw new Error(`User with email ${input.email} already exists`);
    }

    // If manager_id is provided, verify the manager exists and has appropriate role
    if (input.manager_id) {
      const manager = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.manager_id))
        .limit(1)
        .execute();

      if (manager.length === 0) {
        throw new Error(`Manager with id ${input.manager_id} does not exist`);
      }

      // Verify manager has appropriate role (Manager, HR_Admin, or System_Admin)
      const managerRole = manager[0].role;
      if (!['Manager', 'HR_Admin', 'System_Admin'].includes(managerRole)) {
        throw new Error(`User with id ${input.manager_id} cannot be a manager (role: ${managerRole})`);
      }
    }

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        role: input.role,
        department: input.department,
        manager_id: input.manager_id,
        profile_picture: input.profile_picture
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};