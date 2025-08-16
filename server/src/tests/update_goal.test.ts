import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable } from '../db/schema';
import { type UpdateGoalInput, type CreateUserInput } from '../schema';
import { updateGoal } from '../handlers/update_goal';
import { eq } from 'drizzle-orm';

// Test user data
const testEmployee: CreateUserInput = {
  email: 'employee@test.com',
  first_name: 'John',
  last_name: 'Doe',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testManager: CreateUserInput = {
  email: 'manager@test.com',
  first_name: 'Jane',
  last_name: 'Smith',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

describe('updateGoal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic goal fields', async () => {
    // Create prerequisite users
    const [employee, manager] = await db.insert(usersTable)
      .values([testEmployee, testManager])
      .returning()
      .execute();

    // Create initial goal
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        priority: 'Low',
        employee_id: employee.id,
        manager_id: manager.id
      })
      .returning()
      .execute();

    // Update goal
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      title: 'Updated Title',
      description: 'Updated description',
      priority: 'High'
    };

    const result = await updateGoal(updateInput);

    expect(result.id).toBe(goal.id);
    expect(result.title).toBe('Updated Title');
    expect(result.description).toBe('Updated description');
    expect(result.priority).toBe('High');
    expect(result.employee_id).toBe(employee.id);
    expect(result.manager_id).toBe(manager.id);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > goal.updated_at).toBe(true);
  });

  it('should handle status transitions correctly', async () => {
    // Create prerequisite user
    const [employee] = await db.insert(usersTable)
      .values([testEmployee])
      .returning()
      .execute();

    // Create initial goal in Draft status
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Test Goal',
        description: 'Test description',
        priority: 'Medium',
        employee_id: employee.id,
        status: 'Draft'
      })
      .returning()
      .execute();

    // Update to Approved status
    const updateToApproved: UpdateGoalInput = {
      id: goal.id,
      status: 'Approved'
    };

    const approvedGoal = await updateGoal(updateToApproved);

    expect(approvedGoal.status).toBe('Approved');
    expect(approvedGoal.approval_date).toBeInstanceOf(Date);
    expect(approvedGoal.completed_date).toBeNull();

    // Update to Completed status
    const updateToCompleted: UpdateGoalInput = {
      id: goal.id,
      status: 'Completed'
    };

    const completedGoal = await updateGoal(updateToCompleted);

    expect(completedGoal.status).toBe('Completed');
    expect(completedGoal.completed_date).toBeInstanceOf(Date);
    expect(completedGoal.approval_date).toBeInstanceOf(Date);
  });

  it('should clear completed_date when status changes away from Completed', async () => {
    // Create prerequisite user
    const [employee] = await db.insert(usersTable)
      .values([testEmployee])
      .returning()
      .execute();

    // Create goal with Completed status
    const completedDate = new Date('2024-01-15T10:00:00Z');
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Test Goal',
        description: 'Test description',
        priority: 'Medium',
        employee_id: employee.id,
        status: 'Completed',
        completed_date: completedDate
      })
      .returning()
      .execute();

    // Update status away from Completed
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      status: 'In_Progress'
    };

    const result = await updateGoal(updateInput);

    expect(result.status).toBe('In_Progress');
    expect(result.completed_date).toBeNull();
  });

  it('should update manager assignment', async () => {
    // Create prerequisite users
    const [employee, oldManager, newManager] = await db.insert(usersTable)
      .values([
        testEmployee,
        { ...testManager, email: 'old.manager@test.com' },
        { ...testManager, email: 'new.manager@test.com' }
      ])
      .returning()
      .execute();

    // Create goal with old manager
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Test Goal',
        description: 'Test description',
        priority: 'Medium',
        employee_id: employee.id,
        manager_id: oldManager.id
      })
      .returning()
      .execute();

    // Update to new manager
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      manager_id: newManager.id
    };

    const result = await updateGoal(updateInput);

    expect(result.manager_id).toBe(newManager.id);
    expect(result.employee_id).toBe(employee.id);
  });

  it('should update due date', async () => {
    // Create prerequisite user
    const [employee] = await db.insert(usersTable)
      .values([testEmployee])
      .returning()
      .execute();

    // Create goal without due date
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Test Goal',
        description: 'Test description',
        priority: 'Medium',
        employee_id: employee.id
      })
      .returning()
      .execute();

    // Update with due date
    const newDueDate = new Date('2024-12-31T23:59:59Z');
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      due_date: newDueDate
    };

    const result = await updateGoal(updateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.toISOString()).toBe(newDueDate.toISOString());
  });

  it('should allow manual override of completion and approval dates', async () => {
    // Create prerequisite user
    const [employee] = await db.insert(usersTable)
      .values([testEmployee])
      .returning()
      .execute();

    // Create goal
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Test Goal',
        description: 'Test description',
        priority: 'Medium',
        employee_id: employee.id,
        status: 'Draft'
      })
      .returning()
      .execute();

    // Update with manual dates
    const manualApprovalDate = new Date('2024-01-10T10:00:00Z');
    const manualCompletedDate = new Date('2024-01-20T10:00:00Z');
    
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      status: 'Completed',
      approval_date: manualApprovalDate,
      completed_date: manualCompletedDate
    };

    const result = await updateGoal(updateInput);

    expect(result.status).toBe('Completed');
    expect(result.approval_date?.toISOString()).toBe(manualApprovalDate.toISOString());
    expect(result.completed_date?.toISOString()).toBe(manualCompletedDate.toISOString());
  });

  it('should preserve existing values when updating only some fields', async () => {
    // Create prerequisite users
    const [employee, manager] = await db.insert(usersTable)
      .values([testEmployee, testManager])
      .returning()
      .execute();

    // Create initial goal with all fields
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        priority: 'High',
        employee_id: employee.id,
        manager_id: manager.id,
        status: 'Approved',
        due_date: new Date('2024-12-31T23:59:59Z'),
        approval_date: new Date('2024-01-10T10:00:00Z')
      })
      .returning()
      .execute();

    // Update only the title
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      title: 'Updated Title Only'
    };

    const result = await updateGoal(updateInput);

    // Updated field
    expect(result.title).toBe('Updated Title Only');
    
    // Preserved fields
    expect(result.description).toBe('Original description');
    expect(result.priority).toBe('High');
    expect(result.status).toBe('Approved');
    expect(result.employee_id).toBe(employee.id);
    expect(result.manager_id).toBe(manager.id);
    expect(result.due_date).toEqual(goal.due_date);
    expect(result.approval_date).toEqual(goal.approval_date);
    
    // Updated timestamp
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > goal.updated_at).toBe(true);
  });

  it('should save updated goal to database', async () => {
    // Create prerequisite user
    const [employee] = await db.insert(usersTable)
      .values([testEmployee])
      .returning()
      .execute();

    // Create initial goal
    const [goal] = await db.insert(goalsTable)
      .values({
        title: 'Original Title',
        description: 'Original description',
        priority: 'Low',
        employee_id: employee.id
      })
      .returning()
      .execute();

    // Update goal
    const updateInput: UpdateGoalInput = {
      id: goal.id,
      title: 'Database Updated Title',
      priority: 'Critical'
    };

    await updateGoal(updateInput);

    // Query database to verify changes were persisted
    const updatedGoals = await db.select()
      .from(goalsTable)
      .where(eq(goalsTable.id, goal.id))
      .execute();

    expect(updatedGoals).toHaveLength(1);
    const dbGoal = updatedGoals[0];
    
    expect(dbGoal.title).toBe('Database Updated Title');
    expect(dbGoal.priority).toBe('Critical');
    expect(dbGoal.description).toBe('Original description'); // Unchanged
    expect(dbGoal.updated_at).toBeInstanceOf(Date);
    expect(dbGoal.updated_at > goal.updated_at).toBe(true);
  });

  it('should throw error for non-existent goal', async () => {
    const updateInput: UpdateGoalInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateGoal(updateInput)).rejects.toThrow(/Goal not found/i);
  });
});