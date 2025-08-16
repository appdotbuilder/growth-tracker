import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUserById } from '../handlers/get_user_by_id';
import { eq } from 'drizzle-orm';

// Test input for creating a user
const testUserInput: CreateUserInput = {
  email: 'test@example.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

// Test input for creating a manager
const testManagerInput: CreateUserInput = {
  email: 'manager@example.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: 'https://example.com/avatar.jpg'
};

describe('getUserById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a user by ID', async () => {
    // Create a test user
    const createResult = await db.insert(usersTable)
      .values({
        email: testUserInput.email,
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        role: testUserInput.role,
        department: testUserInput.department,
        manager_id: testUserInput.manager_id,
        profile_picture: testUserInput.profile_picture
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test the handler
    const result = await getUserById(createdUser.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdUser.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.first_name).toEqual('John');
    expect(result!.last_name).toEqual('Doe');
    expect(result!.role).toEqual('Employee');
    expect(result!.department).toEqual('Engineering');
    expect(result!.manager_id).toBeNull();
    expect(result!.profile_picture).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return a user with manager_id when set', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values({
        email: testManagerInput.email,
        first_name: testManagerInput.first_name,
        last_name: testManagerInput.last_name,
        role: testManagerInput.role,
        department: testManagerInput.department,
        manager_id: testManagerInput.manager_id,
        profile_picture: testManagerInput.profile_picture
      })
      .returning()
      .execute();

    const manager = managerResult[0];

    // Create employee with manager
    const employeeResult = await db.insert(usersTable)
      .values({
        email: testUserInput.email,
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        role: testUserInput.role,
        department: testUserInput.department,
        manager_id: manager.id,
        profile_picture: testUserInput.profile_picture
      })
      .returning()
      .execute();

    const employee = employeeResult[0];

    // Test the handler
    const result = await getUserById(employee.id);

    expect(result).toBeDefined();
    expect(result!.id).toEqual(employee.id);
    expect(result!.manager_id).toEqual(manager.id);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.role).toEqual('Employee');
  });

  it('should return user with profile_picture when set', async () => {
    // Create user with profile picture
    const createResult = await db.insert(usersTable)
      .values({
        email: testManagerInput.email,
        first_name: testManagerInput.first_name,
        last_name: testManagerInput.last_name,
        role: testManagerInput.role,
        department: testManagerInput.department,
        manager_id: testManagerInput.manager_id,
        profile_picture: testManagerInput.profile_picture
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Test the handler
    const result = await getUserById(createdUser.id);

    expect(result).toBeDefined();
    expect(result!.profile_picture).toEqual('https://example.com/avatar.jpg');
    expect(result!.role).toEqual('Manager');
  });

  it('should return null for non-existent user ID', async () => {
    const result = await getUserById(999999);
    expect(result).toBeNull();
  });

  it('should return null for zero ID', async () => {
    const result = await getUserById(0);
    expect(result).toBeNull();
  });

  it('should return null for negative ID', async () => {
    const result = await getUserById(-1);
    expect(result).toBeNull();
  });

  it('should handle different user roles correctly', async () => {
    // Create HR Admin user
    const hrAdminResult = await db.insert(usersTable)
      .values({
        email: 'hr@example.com',
        first_name: 'HR',
        last_name: 'Admin',
        role: 'HR_Admin',
        department: 'Human Resources',
        manager_id: null,
        profile_picture: null
      })
      .returning()
      .execute();

    const hrAdmin = hrAdminResult[0];

    const result = await getUserById(hrAdmin.id);

    expect(result).toBeDefined();
    expect(result!.role).toEqual('HR_Admin');
    expect(result!.department).toEqual('Human Resources');
  });

  it('should verify user exists in database after retrieval', async () => {
    // Create a test user
    const createResult = await db.insert(usersTable)
      .values({
        email: testUserInput.email,
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        role: testUserInput.role,
        department: testUserInput.department,
        manager_id: testUserInput.manager_id,
        profile_picture: testUserInput.profile_picture
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    // Get user through handler
    const handlerResult = await getUserById(createdUser.id);

    // Verify user still exists in database
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, createdUser.id))
      .execute();

    expect(dbUsers).toHaveLength(1);
    expect(handlerResult).toBeDefined();
    expect(handlerResult!.id).toEqual(dbUsers[0].id);
    expect(handlerResult!.email).toEqual(dbUsers[0].email);
    expect(handlerResult!.created_at).toEqual(dbUsers[0].created_at);
  });

  it('should handle users with null department', async () => {
    // Create user with null department
    const createResult = await db.insert(usersTable)
      .values({
        email: testUserInput.email,
        first_name: testUserInput.first_name,
        last_name: testUserInput.last_name,
        role: testUserInput.role,
        department: null,
        manager_id: testUserInput.manager_id,
        profile_picture: testUserInput.profile_picture
      })
      .returning()
      .execute();

    const createdUser = createResult[0];

    const result = await getUserById(createdUser.id);

    expect(result).toBeDefined();
    expect(result!.department).toBeNull();
    expect(result!.first_name).toEqual('John');
  });
});