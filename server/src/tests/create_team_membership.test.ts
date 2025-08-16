import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teamMembershipsTable } from '../db/schema';
import { type CreateTeamMembershipInput } from '../schema';
import { createTeamMembership } from '../handlers/create_team_membership';
import { eq, and } from 'drizzle-orm';

describe('createTeamMembership', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let manager: any;
  let employee: any;
  let hrAdmin: any;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'manager@company.com',
          first_name: 'John',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'employee@company.com',
          first_name: 'Jane',
          last_name: 'Employee',
          role: 'Employee',
          department: 'Engineering'
        },
        {
          email: 'hr@company.com',
          first_name: 'HR',
          last_name: 'Admin',
          role: 'HR_Admin',
          department: 'Human Resources'
        }
      ])
      .returning()
      .execute();

    manager = users[0];
    employee = users[1];
    hrAdmin = users[2];
  });

  it('should create a team membership successfully', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: manager.id,
      employee_id: employee.id
    };

    const result = await createTeamMembership(input);

    expect(result.id).toBeDefined();
    expect(result.manager_id).toEqual(manager.id);
    expect(result.employee_id).toEqual(employee.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save team membership to database', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: manager.id,
      employee_id: employee.id
    };

    const result = await createTeamMembership(input);

    const memberships = await db.select()
      .from(teamMembershipsTable)
      .where(eq(teamMembershipsTable.id, result.id))
      .execute();

    expect(memberships).toHaveLength(1);
    expect(memberships[0].manager_id).toEqual(manager.id);
    expect(memberships[0].employee_id).toEqual(employee.id);
    expect(memberships[0].created_at).toBeInstanceOf(Date);
  });

  it('should allow HR_Admin to create team memberships', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: hrAdmin.id,
      employee_id: employee.id
    };

    const result = await createTeamMembership(input);

    expect(result.manager_id).toEqual(hrAdmin.id);
    expect(result.employee_id).toEqual(employee.id);
  });

  it('should throw error when manager does not exist', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: 9999,
      employee_id: employee.id
    };

    await expect(createTeamMembership(input)).rejects.toThrow(/Manager with ID 9999 does not exist/i);
  });

  it('should throw error when employee does not exist', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: manager.id,
      employee_id: 9999
    };

    await expect(createTeamMembership(input)).rejects.toThrow(/Employee with ID 9999 does not exist/i);
  });

  it('should throw error when employee tries to manage themselves', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: employee.id,
      employee_id: employee.id
    };

    await expect(createTeamMembership(input)).rejects.toThrow(/Employee cannot manage themselves/i);
  });

  it('should throw error when user with Employee role tries to manage others', async () => {
    const regularEmployee = await db.insert(usersTable)
      .values({
        email: 'regular@company.com',
        first_name: 'Regular',
        last_name: 'Employee',
        role: 'Employee',
        department: 'Engineering'
      })
      .returning()
      .execute();

    const input: CreateTeamMembershipInput = {
      manager_id: regularEmployee[0].id,
      employee_id: employee.id
    };

    await expect(createTeamMembership(input)).rejects.toThrow(/User must have Manager, HR_Admin, or System_Admin role/i);
  });

  it('should throw error when team membership already exists', async () => {
    const input: CreateTeamMembershipInput = {
      manager_id: manager.id,
      employee_id: employee.id
    };

    // Create first membership
    await createTeamMembership(input);

    // Try to create duplicate
    await expect(createTeamMembership(input)).rejects.toThrow(/Team membership already exists/i);
  });

  it('should prevent circular reporting relationships', async () => {
    // Create additional users for circular test
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'middle@company.com',
          first_name: 'Middle',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'top@company.com',
          first_name: 'Top',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'employee2@company.com',
          first_name: 'Employee',
          last_name: 'Two',
          role: 'Manager', // Give manager role to test circular reporting
          department: 'Engineering'
        }
      ])
      .returning()
      .execute();

    const middleManager = users[0];
    const topManager = users[1];
    const employeeManager = users[2];

    // Create chain: topManager -> middleManager -> employeeManager
    await createTeamMembership({
      manager_id: topManager.id,
      employee_id: middleManager.id
    });

    await createTeamMembership({
      manager_id: middleManager.id,
      employee_id: employeeManager.id
    });

    // Try to create circular relationship: employeeManager -> topManager
    const circularInput: CreateTeamMembershipInput = {
      manager_id: employeeManager.id,
      employee_id: topManager.id
    };

    await expect(createTeamMembership(circularInput)).rejects.toThrow(/circular reporting relationship/i);
  });

  it('should allow System_Admin to create team memberships', async () => {
    const systemAdmin = await db.insert(usersTable)
      .values({
        email: 'admin@company.com',
        first_name: 'System',
        last_name: 'Admin',
        role: 'System_Admin',
        department: 'IT'
      })
      .returning()
      .execute();

    const input: CreateTeamMembershipInput = {
      manager_id: systemAdmin[0].id,
      employee_id: employee.id
    };

    const result = await createTeamMembership(input);

    expect(result.manager_id).toEqual(systemAdmin[0].id);
    expect(result.employee_id).toEqual(employee.id);
  });

  it('should handle complex circular reporting detection', async () => {
    // Create a longer chain and test circular detection
    const users = await db.insert(usersTable)
      .values([
        {
          email: 'level1@company.com',
          first_name: 'Level1',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'level2@company.com',
          first_name: 'Level2',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'level3@company.com',
          first_name: 'Level3',
          last_name: 'Manager',
          role: 'Manager',
          department: 'Engineering'
        },
        {
          email: 'level4@company.com',
          first_name: 'Level4',
          last_name: 'Manager',
          role: 'Manager', // Give manager role to test circular reporting
          department: 'Engineering'
        }
      ])
      .returning()
      .execute();

    const level1 = users[0];
    const level2 = users[1];
    const level3 = users[2];
    const level4 = users[3];

    // Create chain: level1 -> level2 -> level3 -> level4
    await createTeamMembership({
      manager_id: level1.id,
      employee_id: level2.id
    });

    await createTeamMembership({
      manager_id: level2.id,
      employee_id: level3.id
    });

    await createTeamMembership({
      manager_id: level3.id,
      employee_id: level4.id
    });

    // Try to create circular relationship: level4 -> level1 (would create a loop)
    const circularInput: CreateTeamMembershipInput = {
      manager_id: level4.id,
      employee_id: level1.id
    };

    await expect(createTeamMembership(circularInput)).rejects.toThrow(/circular reporting relationship/i);
  });
});