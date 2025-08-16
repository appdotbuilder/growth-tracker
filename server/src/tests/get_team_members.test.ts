import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, teamMembershipsTable } from '../db/schema';
import { type CreateUserInput, type CreateTeamMembershipInput } from '../schema';
import { getTeamMembers } from '../handlers/get_team_members';

// Test user inputs
const managerInput: CreateUserInput = {
  email: 'manager@test.com',
  first_name: 'John',
  last_name: 'Manager',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const directReportInput: CreateUserInput = {
  email: 'direct@test.com',
  first_name: 'Jane',
  last_name: 'Direct',
  role: 'Employee',
  department: 'Engineering',
  manager_id: 1, // Will be set dynamically
  profile_picture: null
};

const teamMemberInput: CreateUserInput = {
  email: 'team@test.com',
  first_name: 'Bob',
  last_name: 'Team',
  role: 'Employee',
  department: 'Design',
  manager_id: null,
  profile_picture: null
};

const otherEmployeeInput: CreateUserInput = {
  email: 'other@test.com',
  first_name: 'Alice',
  last_name: 'Other',
  role: 'Employee',
  department: 'Marketing',
  manager_id: null,
  profile_picture: null
};

describe('getTeamMembers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when manager has no team members', async () => {
    // Create a manager with no team members
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return direct reports only', async () => {
    // Create manager
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    // Create direct report
    const directReport = await db.insert(usersTable)
      .values({
        ...directReportInput,
        manager_id: manager[0].id
      })
      .returning()
      .execute();

    // Create unrelated employee
    await db.insert(usersTable)
      .values(otherEmployeeInput)
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(directReport[0].id);
    expect(result[0].first_name).toEqual('Jane');
    expect(result[0].last_name).toEqual('Direct');
    expect(result[0].email).toEqual('direct@test.com');
    expect(result[0].manager_id).toEqual(manager[0].id);
  });

  it('should return team members via team_memberships only', async () => {
    // Create manager
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    // Create team member (not a direct report)
    const teamMember = await db.insert(usersTable)
      .values(teamMemberInput)
      .returning()
      .execute();

    // Create team membership
    await db.insert(teamMembershipsTable)
      .values({
        manager_id: manager[0].id,
        employee_id: teamMember[0].id
      })
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(teamMember[0].id);
    expect(result[0].first_name).toEqual('Bob');
    expect(result[0].last_name).toEqual('Team');
    expect(result[0].department).toEqual('Design');
    expect(result[0].manager_id).toBeNull();
  });

  it('should return both direct reports and team members', async () => {
    // Create manager
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    // Create direct report
    const directReport = await db.insert(usersTable)
      .values({
        ...directReportInput,
        manager_id: manager[0].id
      })
      .returning()
      .execute();

    // Create team member (not a direct report)
    const teamMember = await db.insert(usersTable)
      .values(teamMemberInput)
      .returning()
      .execute();

    // Create team membership
    await db.insert(teamMembershipsTable)
      .values({
        manager_id: manager[0].id,
        employee_id: teamMember[0].id
      })
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    expect(result).toHaveLength(2);
    
    // Find each user in results
    const directReportResult = result.find(u => u.id === directReport[0].id);
    const teamMemberResult = result.find(u => u.id === teamMember[0].id);

    expect(directReportResult).toBeDefined();
    expect(directReportResult?.first_name).toEqual('Jane');
    expect(directReportResult?.manager_id).toEqual(manager[0].id);

    expect(teamMemberResult).toBeDefined();
    expect(teamMemberResult?.first_name).toEqual('Bob');
    expect(teamMemberResult?.manager_id).toBeNull();
  });

  it('should remove duplicates when user is both direct report and team member', async () => {
    // Create manager
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    // Create employee who is both direct report and team member
    const employee = await db.insert(usersTable)
      .values({
        ...directReportInput,
        manager_id: manager[0].id
      })
      .returning()
      .execute();

    // Also add as team member
    await db.insert(teamMembershipsTable)
      .values({
        manager_id: manager[0].id,
        employee_id: employee[0].id
      })
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    // Should return only one instance of the employee
    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(employee[0].id);
    expect(result[0].first_name).toEqual('Jane');
  });

  it('should return all required user fields', async () => {
    // Create manager
    const manager = await db.insert(usersTable)
      .values(managerInput)
      .returning()
      .execute();

    // Create direct report with profile picture
    const directReport = await db.insert(usersTable)
      .values({
        ...directReportInput,
        manager_id: manager[0].id,
        profile_picture: 'https://example.com/profile.jpg'
      })
      .returning()
      .execute();

    const result = await getTeamMembers(manager[0].id);

    expect(result).toHaveLength(1);
    const user = result[0];
    
    // Verify all required fields are present
    expect(user.id).toEqual(directReport[0].id);
    expect(user.email).toEqual('direct@test.com');
    expect(user.first_name).toEqual('Jane');
    expect(user.last_name).toEqual('Direct');
    expect(user.role).toEqual('Employee');
    expect(user.department).toEqual('Engineering');
    expect(user.manager_id).toEqual(manager[0].id);
    expect(user.profile_picture).toEqual('https://example.com/profile.jpg');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);
  });

  it('should handle non-existent manager gracefully', async () => {
    const result = await getTeamMembers(999);
    
    expect(result).toHaveLength(0);
  });
});