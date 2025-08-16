import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUser1: CreateUserInput = {
  email: 'john.doe@company.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testUser2: CreateUserInput = {
  email: 'jane.smith@company.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: 'https://example.com/jane.jpg'
};

const testUser3: CreateUserInput = {
  email: 'bob.wilson@company.com',
  first_name: 'Bob',
  last_name: 'Wilson',
  role: 'HR_Admin',
  department: 'Human Resources',
  manager_id: null,
  profile_picture: null
};

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable).values([testUser1, testUser2, testUser3]).execute();

    const result = await getUsers();

    // Should return all 3 users
    expect(result).toHaveLength(3);
    
    // Verify user data structure
    const john = result.find(u => u.email === 'john.doe@company.com');
    expect(john).toBeDefined();
    expect(john!.first_name).toEqual('John');
    expect(john!.last_name).toEqual('Doe');
    expect(john!.role).toEqual('Employee');
    expect(john!.department).toEqual('Engineering');
    expect(john!.manager_id).toBeNull();
    expect(john!.id).toBeDefined();
    expect(john!.created_at).toBeInstanceOf(Date);
    expect(john!.updated_at).toBeInstanceOf(Date);

    // Verify manager user
    const jane = result.find(u => u.email === 'jane.smith@company.com');
    expect(jane).toBeDefined();
    expect(jane!.role).toEqual('Manager');
    expect(jane!.profile_picture).toEqual('https://example.com/jane.jpg');

    // Verify HR admin user
    const bob = result.find(u => u.email === 'bob.wilson@company.com');
    expect(bob).toBeDefined();
    expect(bob!.role).toEqual('HR_Admin');
    expect(bob!.department).toEqual('Human Resources');
  });

  it('should handle user with manager relationship', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values({
        ...testUser2,
        role: 'Manager'
      })
      .returning()
      .execute();

    const managerId = managerResult[0].id;

    // Create employee with manager
    await db.insert(usersTable)
      .values({
        ...testUser1,
        manager_id: managerId
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    const employee = result.find(u => u.email === testUser1.email);
    expect(employee).toBeDefined();
    expect(employee!.manager_id).toEqual(managerId);

    const manager = result.find(u => u.email === testUser2.email);
    expect(manager).toBeDefined();
    expect(manager!.manager_id).toBeNull();
  });

  it('should return users with all role types', async () => {
    // Create users with different roles
    const users = [
      { ...testUser1, role: 'Employee' as const },
      { ...testUser2, role: 'Manager' as const, email: 'manager@company.com' },
      { ...testUser3, role: 'HR_Admin' as const, email: 'hr@company.com' },
      { 
        ...testUser1, 
        role: 'System_Admin' as const, 
        email: 'admin@company.com',
        first_name: 'System',
        last_name: 'Admin'
      }
    ];

    await db.insert(usersTable).values(users).execute();

    const result = await getUsers();

    expect(result).toHaveLength(4);
    
    const roles = result.map(u => u.role).sort();
    expect(roles).toEqual(['Employee', 'HR_Admin', 'Manager', 'System_Admin']);
  });

  it('should preserve user data integrity', async () => {
    // Create user with all possible field values
    const complexUser = {
      email: 'complex.user@company.com',
      first_name: 'Complex',
      last_name: 'User',
      role: 'Manager' as const,
      department: 'Special Projects',
      manager_id: null,
      profile_picture: 'https://cdn.example.com/profiles/complex-user.png'
    };

    await db.insert(usersTable).values(complexUser).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Verify all fields are preserved correctly
    expect(user.email).toEqual(complexUser.email);
    expect(user.first_name).toEqual(complexUser.first_name);
    expect(user.last_name).toEqual(complexUser.last_name);
    expect(user.role).toEqual(complexUser.role);
    expect(user.department).toEqual(complexUser.department);
    expect(user.manager_id).toEqual(complexUser.manager_id);
    expect(user.profile_picture).toEqual(complexUser.profile_picture);
    
    // Verify auto-generated fields
    expect(typeof user.id).toBe('number');
    expect(user.id).toBeGreaterThan(0);
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });
});