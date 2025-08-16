import { db } from '../db';
import { teamMembershipsTable, usersTable } from '../db/schema';
import { type CreateTeamMembershipInput, type TeamMembership } from '../schema';
import { eq, and, or } from 'drizzle-orm';

export const createTeamMembership = async (input: CreateTeamMembershipInput): Promise<TeamMembership> => {
  try {
    // Validate that both manager and employee exist
    const [manager, employee] = await Promise.all([
      db.select().from(usersTable).where(eq(usersTable.id, input.manager_id)).execute(),
      db.select().from(usersTable).where(eq(usersTable.id, input.employee_id)).execute()
    ]);

    if (manager.length === 0) {
      throw new Error(`Manager with ID ${input.manager_id} does not exist`);
    }

    if (employee.length === 0) {
      throw new Error(`Employee with ID ${input.employee_id} does not exist`);
    }

    // Prevent self-reporting (employee cannot manage themselves)
    if (input.manager_id === input.employee_id) {
      throw new Error('Employee cannot manage themselves');
    }

    // Validate manager has appropriate role (Manager, HR_Admin, or System_Admin)
    const managerData = manager[0];
    if (!['Manager', 'HR_Admin', 'System_Admin'].includes(managerData.role)) {
      throw new Error('User must have Manager, HR_Admin, or System_Admin role to manage team members');
    }

    // Check for existing team membership
    const existingMembership = await db.select()
      .from(teamMembershipsTable)
      .where(
        and(
          eq(teamMembershipsTable.manager_id, input.manager_id),
          eq(teamMembershipsTable.employee_id, input.employee_id)
        )
      )
      .execute();

    if (existingMembership.length > 0) {
      throw new Error('Team membership already exists for this manager-employee pair');
    }

    // Prevent circular reporting relationships
    // Check if the manager is already managed by the employee (directly or indirectly)
    const checkCircularReporting = async (managerId: number, employeeId: number, visited = new Set<number>()): Promise<boolean> => {
      if (visited.has(managerId)) {
        return false; // Avoid infinite loops
      }
      visited.add(managerId);

      // Check if this manager is managed by the employee
      const managerMemberships = await db.select()
        .from(teamMembershipsTable)
        .where(eq(teamMembershipsTable.employee_id, managerId))
        .execute();

      for (const membership of managerMemberships) {
        if (membership.manager_id === employeeId) {
          return true; // Circular dependency found
        }
        // Recursively check up the chain
        if (await checkCircularReporting(membership.manager_id, employeeId, visited)) {
          return true;
        }
      }

      return false;
    };

    const hasCircularReporting = await checkCircularReporting(input.manager_id, input.employee_id);
    if (hasCircularReporting) {
      throw new Error('Cannot create team membership: would create circular reporting relationship');
    }

    // Create the team membership
    const result = await db.insert(teamMembershipsTable)
      .values({
        manager_id: input.manager_id,
        employee_id: input.employee_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Team membership creation failed:', error);
    throw error;
  }
};