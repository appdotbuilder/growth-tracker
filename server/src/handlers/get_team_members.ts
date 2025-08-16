import { db } from '../db';
import { usersTable, teamMembershipsTable } from '../db/schema';
import { type User } from '../schema';
import { eq, or } from 'drizzle-orm';

export const getTeamMembers = async (managerId: number): Promise<User[]> => {
  try {
    // Query for all users who are either:
    // 1. Direct reports (manager_id equals managerId)
    // 2. Members via team_memberships table
    const results = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      first_name: usersTable.first_name,
      last_name: usersTable.last_name,
      role: usersTable.role,
      department: usersTable.department,
      manager_id: usersTable.manager_id,
      profile_picture: usersTable.profile_picture,
      created_at: usersTable.created_at,
      updated_at: usersTable.updated_at
    })
    .from(usersTable)
    .leftJoin(teamMembershipsTable, eq(teamMembershipsTable.employee_id, usersTable.id))
    .where(
      or(
        eq(usersTable.manager_id, managerId),
        eq(teamMembershipsTable.manager_id, managerId)
      )
    )
    .execute();

    // Remove duplicates (users might appear in both direct reports and team memberships)
    const uniqueUsers = new Map<number, User>();
    
    results.forEach(result => {
      if (!uniqueUsers.has(result.id)) {
        uniqueUsers.set(result.id, {
          id: result.id,
          email: result.email,
          first_name: result.first_name,
          last_name: result.last_name,
          role: result.role,
          department: result.department,
          manager_id: result.manager_id,
          profile_picture: result.profile_picture,
          created_at: result.created_at,
          updated_at: result.updated_at
        });
      }
    });

    return Array.from(uniqueUsers.values());
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    throw error;
  }
};