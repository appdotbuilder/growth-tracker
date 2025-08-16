import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs
const testEmployeeInput: CreateUserInput = {
  email: 'employee@test.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testManagerInput: CreateUserInput = {
  email: 'manager@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: 'https://example.com/avatar.jpg'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user successfully', async () => {
    const result = await createUser(testEmployeeInput);

    // Verify returned user data
    expect(result.email).toEqual('employee@test.com');
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.role).toEqual('Employee');
    expect(result.department).toEqual('Engineering');
    expect(result.manager_id).toBeNull();
    expect(result.profile_picture).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(testEmployeeInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('employee@test.com');
    expect(users[0].first_name).toEqual('John');
    expect(users[0].last_name).toEqual('Doe');
    expect(users[0].role).toEqual('Employee');
    expect(users[0].department).toEqual('Engineering');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create user with manager relationship', async () => {
    // First create a manager
    const manager = await createUser(testManagerInput);

    // Create an employee with the manager
    const employeeInput: CreateUserInput = {
      ...testEmployeeInput,
      email: 'employee.with.manager@test.com',
      manager_id: manager.id
    };

    const result = await createUser(employeeInput);

    // Verify manager relationship
    expect(result.manager_id).toEqual(manager.id);

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].manager_id).toEqual(manager.id);
  });

  it('should create user with HR_Admin as manager', async () => {
    // Create an HR_Admin user
    const hrAdmin = await createUser({
      email: 'hr@test.com',
      first_name: 'HR',
      last_name: 'Admin',
      role: 'HR_Admin',
      department: 'Human Resources',
      manager_id: null,
      profile_picture: null
    });

    // Create employee with HR_Admin as manager
    const employeeInput: CreateUserInput = {
      ...testEmployeeInput,
      email: 'employee.with.hr@test.com',
      manager_id: hrAdmin.id
    };

    const result = await createUser(employeeInput);
    expect(result.manager_id).toEqual(hrAdmin.id);
  });

  it('should create user with System_Admin as manager', async () => {
    // Create a System_Admin user
    const sysAdmin = await createUser({
      email: 'sysadmin@test.com',
      first_name: 'System',
      last_name: 'Admin',
      role: 'System_Admin',
      department: 'IT',
      manager_id: null,
      profile_picture: null
    });

    // Create employee with System_Admin as manager
    const employeeInput: CreateUserInput = {
      ...testEmployeeInput,
      email: 'employee.with.sysadmin@test.com',
      manager_id: sysAdmin.id
    };

    const result = await createUser(employeeInput);
    expect(result.manager_id).toEqual(sysAdmin.id);
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testEmployeeInput);

    // Attempt to create another user with same email
    await expect(createUser(testEmployeeInput))
      .rejects
      .toThrow(/User with email employee@test.com already exists/i);
  });

  it('should throw error for non-existent manager', async () => {
    const invalidManagerInput: CreateUserInput = {
      ...testEmployeeInput,
      manager_id: 999
    };

    await expect(createUser(invalidManagerInput))
      .rejects
      .toThrow(/Manager with id 999 does not exist/i);
  });

  it('should throw error when Employee role user is assigned as manager', async () => {
    // Create an employee user
    const employee = await createUser(testEmployeeInput);

    // Try to create another user with the employee as manager
    const invalidInput: CreateUserInput = {
      email: 'another@test.com',
      first_name: 'Another',
      last_name: 'User',
      role: 'Employee',
      department: 'Engineering',
      manager_id: employee.id,
      profile_picture: null
    };

    await expect(createUser(invalidInput))
      .rejects
      .toThrow(/User with id \d+ cannot be a manager \(role: Employee\)/i);
  });

  it('should create user with all fields populated', async () => {
    const fullInput: CreateUserInput = {
      email: 'full.user@test.com',
      first_name: 'Full',
      last_name: 'User',
      role: 'Manager',
      department: 'Marketing',
      manager_id: null,
      profile_picture: 'https://example.com/full-user.jpg'
    };

    const result = await createUser(fullInput);

    expect(result.email).toEqual('full.user@test.com');
    expect(result.first_name).toEqual('Full');
    expect(result.last_name).toEqual('User');
    expect(result.role).toEqual('Manager');
    expect(result.department).toEqual('Marketing');
    expect(result.profile_picture).toEqual('https://example.com/full-user.jpg');
    expect(result.manager_id).toBeNull();
  });

  it('should create user with null department', async () => {
    const nullDeptInput: CreateUserInput = {
      ...testEmployeeInput,
      email: 'nodept@test.com',
      department: null
    };

    const result = await createUser(nullDeptInput);
    expect(result.department).toBeNull();

    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].department).toBeNull();
  });
});