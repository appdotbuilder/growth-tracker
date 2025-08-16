import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { approveGoal } from '../handlers/approve_goal';
import { eq } from 'drizzle-orm';

describe('approveGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test data setup
  let employee: any;
  let manager: any;
  let hrAdmin: any;
  let otherManager: any;
  let pendingGoal: any;
  let draftGoal: any;
  let approvedGoal: any;

  beforeEach(async () => {
    // Create test users
    const users = await db.insert(usersTable).values([
      {
        email: 'employee@test.com',
        first_name: 'John',
        last_name: 'Employee',
        role: 'Employee',
        department: 'Engineering'
      },
      {
        email: 'manager@test.com',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'Manager',
        department: 'Engineering'
      },
      {
        email: 'hr@test.com',
        first_name: 'HR',
        last_name: 'Admin',
        role: 'HR_Admin',
        department: 'HR'
      },
      {
        email: 'othermanager@test.com',
        first_name: 'Other',
        last_name: 'Manager',
        role: 'Manager',
        department: 'Marketing'
      }
    ]).returning().execute();

    employee = users[0];
    manager = users[1];
    hrAdmin = users[2];
    otherManager = users[3];

    // Set employee's direct manager
    await db.update(usersTable)
      .set({ manager_id: manager.id })
      .where(eq(usersTable.id, employee.id))
      .execute();

    // Create test goals
    const goals = await db.insert(goalsTable).values([
      {
        title: 'Pending Goal',
        description: 'A goal pending approval',
        status: 'Pending_Approval',
        priority: 'High',
        employee_id: employee.id,
        manager_id: manager.id
      },
      {
        title: 'Draft Goal',
        description: 'A draft goal',
        status: 'Draft',
        priority: 'Medium',
        employee_id: employee.id
      },
      {
        title: 'Already Approved Goal',
        description: 'An already approved goal',
        status: 'Approved',
        priority: 'Low',
        employee_id: employee.id,
        manager_id: manager.id,
        approval_date: new Date()
      }
    ]).returning().execute();

    pendingGoal = goals[0];
    draftGoal = goals[1];
    approvedGoal = goals[2];
  });

  it('should successfully approve a pending goal by assigned manager', async () => {
    const result = await approveGoal(pendingGoal.id, manager.id);

    // Verify returned goal
    expect(result.id).toBe(pendingGoal.id);
    expect(result.status).toBe('Approved');
    expect(result.manager_id).toBe(manager.id);
    expect(result.approval_date).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify database was updated
    const updatedGoal = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, pendingGoal.id))
      .execute();

    expect(updatedGoal).toHaveLength(1);
    expect(updatedGoal[0].status).toBe('Approved');
    expect(updatedGoal[0].approval_date).toBeInstanceOf(Date);
    expect(updatedGoal[0].manager_id).toBe(manager.id);
  });

  it('should successfully approve a goal by employee\'s direct manager', async () => {
    // Create a goal without assigned manager
    const unassignedGoal = await db.insert(goalsTable).values({
      title: 'Unassigned Goal',
      description: 'A goal without assigned manager',
      status: 'Pending_Approval',
      priority: 'Medium',
      employee_id: employee.id
    }).returning().execute();

    const result = await approveGoal(unassignedGoal[0].id, manager.id);

    expect(result.status).toBe('Approved');
    expect(result.manager_id).toBe(manager.id);
    expect(result.approval_date).toBeInstanceOf(Date);
  });

  it('should successfully approve a goal by HR Admin', async () => {
    const result = await approveGoal(pendingGoal.id, hrAdmin.id);

    expect(result.status).toBe('Approved');
    expect(result.manager_id).toBe(hrAdmin.id);
    expect(result.approval_date).toBeInstanceOf(Date);
  });

  it('should throw error when goal does not exist', async () => {
    await expect(approveGoal(99999, manager.id)).rejects.toThrow(/Goal with id 99999 not found/);
  });

  it('should throw error when goal is not pending approval', async () => {
    await expect(approveGoal(draftGoal.id, manager.id)).rejects.toThrow(/Goal is not pending approval/);
    await expect(approveGoal(approvedGoal.id, manager.id)).rejects.toThrow(/Goal is not pending approval/);
  });

  it('should throw error when manager does not exist', async () => {
    await expect(approveGoal(pendingGoal.id, 99999)).rejects.toThrow(/Manager with id 99999 not found/);
  });

  it('should throw error when user is not a manager or admin', async () => {
    await expect(approveGoal(pendingGoal.id, employee.id)).rejects.toThrow(/User does not have permission to approve goals/);
  });

  it('should throw error when manager has no permission for this goal', async () => {
    await expect(approveGoal(pendingGoal.id, otherManager.id)).rejects.toThrow(/Manager does not have permission to approve this goal/);
  });

  it('should handle goal assigned to different manager but approved by direct manager', async () => {
    // Create a goal assigned to other manager but for employee under our manager
    const crossAssignedGoal = await db.insert(goalsTable).values({
      title: 'Cross-assigned Goal',
      description: 'Goal assigned to other manager',
      status: 'Pending_Approval',
      priority: 'High',
      employee_id: employee.id,
      manager_id: otherManager.id // Assigned to other manager
    }).returning().execute();

    // Direct manager should still be able to approve
    const result = await approveGoal(crossAssignedGoal[0].id, manager.id);

    expect(result.status).toBe('Approved');
    expect(result.manager_id).toBe(manager.id); // Should update to approving manager
  });

  it('should preserve all other goal fields when approving', async () => {
    const result = await approveGoal(pendingGoal.id, manager.id);

    expect(result.title).toBe(pendingGoal.title);
    expect(result.description).toBe(pendingGoal.description);
    expect(result.priority).toBe(pendingGoal.priority);
    expect(result.employee_id).toBe(pendingGoal.employee_id);
    expect(result.due_date).toBe(pendingGoal.due_date);
    expect(result.completed_date).toBe(pendingGoal.completed_date);
    expect(result.created_at).toEqual(pendingGoal.created_at);
  });

  it('should handle System_Admin role approval', async () => {
    // Create a system admin
    const systemAdmin = await db.insert(usersTable).values({
      email: 'sysadmin@test.com',
      first_name: 'System',
      last_name: 'Admin',
      role: 'System_Admin',
      department: 'IT'
    }).returning().execute();

    const result = await approveGoal(pendingGoal.id, systemAdmin[0].id);

    expect(result.status).toBe('Approved');
    expect(result.manager_id).toBe(systemAdmin[0].id);
  });

  it('should handle employee with no manager assigned', async () => {
    // Create employee with no manager
    const orphanEmployee = await db.insert(usersTable).values({
      email: 'orphan@test.com',
      first_name: 'Orphan',
      last_name: 'Employee',
      role: 'Employee',
      department: 'Engineering',
      manager_id: null
    }).returning().execute();

    const orphanGoal = await db.insert(goalsTable).values({
      title: 'Orphan Goal',
      description: 'Goal from employee with no manager',
      status: 'Pending_Approval',
      priority: 'Medium',
      employee_id: orphanEmployee[0].id
    }).returning().execute();

    // Regular manager should not be able to approve
    await expect(approveGoal(orphanGoal[0].id, manager.id)).rejects.toThrow(/Manager does not have permission to approve this goal/);

    // But HR Admin should be able to approve
    const result = await approveGoal(orphanGoal[0].id, hrAdmin.id);
    expect(result.status).toBe('Approved');
  });
});