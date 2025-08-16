import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // First check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error(`User with id ${input.id} not found`);
    }

    // If manager_id is provided, validate the manager exists
    if (input.manager_id !== undefined && input.manager_id !== null) {
      const managerExists = await db.select()
        .from(usersTable)
        .where(eq(usersTable.id, input.manager_id))
        .execute();

      if (managerExists.length === 0) {
        throw new Error(`Manager with id ${input.manager_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.email !== undefined) updateData.email = input.email;
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.department !== undefined) updateData.department = input.department;
    if (input.manager_id !== undefined) updateData.manager_id = input.manager_id;
    if (input.profile_picture !== undefined) updateData.profile_picture = input.profile_picture;

    // Update the user
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};