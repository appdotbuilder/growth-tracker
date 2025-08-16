import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async (userData?: Partial<CreateUserInput>) => {
  const defaultUserData: CreateUserInput = {
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'Employee',
    department: 'Engineering',
    manager_id: null,
    profile_picture: null
  };

  const result = await db.insert(usersTable)
    .values({ ...defaultUserData, ...userData })
    .returning()
    .execute();

  return result[0];
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user with all fields', async () => {
    // Create manager first
    const manager = await createTestUser({
      email: 'manager@example.com',
      first_name: 'Jane',
      last_name: 'Manager',
      role: 'Manager'
    });

    // Create employee
    const employee = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: employee.id,
      email: 'updated@example.com',
      first_name: 'Updated',
      last_name: 'Name',
      role: 'Manager',
      department: 'Sales',
      manager_id: manager.id,
      profile_picture: 'https://example.com/photo.jpg'
    };

    const result = await updateUser(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(employee.id);
    expect(result.email).toEqual('updated@example.com');
    expect(result.first_name).toEqual('Updated');
    expect(result.last_name).toEqual('Name');
    expect(result.role).toEqual('Manager');
    expect(result.department).toEqual('Sales');
    expect(result.manager_id).toEqual(manager.id);
    expect(result.profile_picture).toEqual('https://example.com/photo.jpg');
    expect(result.created_at).toEqual(employee.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > employee.updated_at).toBe(true);
  });

  it('should update user with partial fields', async () => {
    const user = await createTestUser();
    const originalEmail = user.email;
    const originalRole = user.role;

    const updateInput: UpdateUserInput = {
      id: user.id,
      first_name: 'UpdatedFirst',
      department: 'Marketing'
    };

    const result = await updateUser(updateInput);

    // Verify updated fields
    expect(result.first_name).toEqual('UpdatedFirst');
    expect(result.department).toEqual('Marketing');

    // Verify unchanged fields
    expect(result.email).toEqual(originalEmail);
    expect(result.role).toEqual(originalRole);
    expect(result.last_name).toEqual(user.last_name);
    expect(result.manager_id).toEqual(user.manager_id);
    expect(result.profile_picture).toEqual(user.profile_picture);
  });

  it('should update user with null values', async () => {
    const user = await createTestUser({
      department: 'Engineering',
      profile_picture: 'old-photo.jpg'
    });

    const updateInput: UpdateUserInput = {
      id: user.id,
      department: null,
      profile_picture: null
    };

    const result = await updateUser(updateInput);

    expect(result.department).toBeNull();
    expect(result.profile_picture).toBeNull();
  });

  it('should update manager_id to null', async () => {
    const manager = await createTestUser({
      email: 'manager@example.com',
      role: 'Manager'
    });

    const employee = await createTestUser({
      manager_id: manager.id
    });

    const updateInput: UpdateUserInput = {
      id: employee.id,
      manager_id: null
    };

    const result = await updateUser(updateInput);

    expect(result.manager_id).toBeNull();
  });

  it('should save changes to database', async () => {
    const user = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: user.id,
      first_name: 'DatabaseTest',
      email: 'dbtest@example.com'
    };

    await updateUser(updateInput);

    // Query database directly to verify changes
    const updatedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(updatedUser).toHaveLength(1);
    expect(updatedUser[0].first_name).toEqual('DatabaseTest');
    expect(updatedUser[0].email).toEqual('dbtest@example.com');
    expect(updatedUser[0].updated_at).toBeInstanceOf(Date);
    expect(updatedUser[0].updated_at > user.updated_at).toBe(true);
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      first_name: 'NonExistent'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/User with id 99999 not found/i);
  });

  it('should throw error when manager does not exist', async () => {
    const user = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: user.id,
      manager_id: 99999
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/Manager with id 99999 not found/i);
  });

  it('should handle email uniqueness constraint violation', async () => {
    const user1 = await createTestUser({
      email: 'user1@example.com'
    });

    const user2 = await createTestUser({
      email: 'user2@example.com'
    });

    const updateInput: UpdateUserInput = {
      id: user2.id,
      email: 'user1@example.com' // Try to use existing email
    };

    await expect(updateUser(updateInput)).rejects.toThrow();
  });

  it('should update role to different values', async () => {
    const user = await createTestUser();

    // Test updating to each role
    const roles = ['Manager', 'HR_Admin', 'System_Admin'] as const;

    for (const role of roles) {
      const updateInput: UpdateUserInput = {
        id: user.id,
        role: role
      };

      const result = await updateUser(updateInput);
      expect(result.role).toEqual(role);
    }
  });

  it('should handle valid manager assignment', async () => {
    const manager = await createTestUser({
      email: 'manager@example.com',
      role: 'Manager'
    });

    const employee1 = await createTestUser({
      email: 'emp1@example.com'
    });

    const employee2 = await createTestUser({
      email: 'emp2@example.com'
    });

    // Assign both employees to same manager
    await updateUser({
      id: employee1.id,
      manager_id: manager.id
    });

    const result = await updateUser({
      id: employee2.id,
      manager_id: manager.id
    });

    expect(result.manager_id).toEqual(manager.id);
  });

  it('should handle empty update gracefully', async () => {
    const user = await createTestUser();

    const updateInput: UpdateUserInput = {
      id: user.id
    };

    const result = await updateUser(updateInput);

    // Should only update the updated_at timestamp
    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual(user.email);
    expect(result.first_name).toEqual(user.first_name);
    expect(result.last_name).toEqual(user.last_name);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });
});