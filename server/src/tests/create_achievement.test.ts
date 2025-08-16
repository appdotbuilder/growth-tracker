import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { achievementsTable, usersTable, goalsTable } from '../db/schema';
import { type CreateAchievementInput } from '../schema';
import { createAchievement } from '../handlers/create_achievement';
import { eq } from 'drizzle-orm';

// Test data
let testUserId: number;
let testManagerId: number;
let testGoalId: number;

const testInput: CreateAchievementInput = {
  title: 'Completed Sales Goal',
  description: 'Successfully exceeded quarterly sales targets by 15%',
  category: 'Goal_Completion',
  employee_id: 0, // Will be set in beforeEach
  goal_id: null, // Will be set conditionally
  achieved_date: new Date('2023-12-15')
};

describe('createAchievement', () => {
  beforeEach(async () => {
    await createDB();

    // Create test users
    const managerResult = await db.insert(usersTable)
      .values({
        email: 'manager@example.com',
        first_name: 'Jane',
        last_name: 'Manager',
        role: 'Manager',
        department: 'Sales'
      })
      .returning()
      .execute();
    testManagerId = managerResult[0].id;

    const employeeResult = await db.insert(usersTable)
      .values({
        email: 'employee@example.com',
        first_name: 'John',
        last_name: 'Employee',
        role: 'Employee',
        department: 'Sales',
        manager_id: testManagerId
      })
      .returning()
      .execute();
    testUserId = employeeResult[0].id;

    // Create test goal
    const goalResult = await db.insert(goalsTable)
      .values({
        title: 'Quarterly Sales Target',
        description: 'Achieve 100% of quarterly sales quota',
        priority: 'High',
        employee_id: testUserId,
        manager_id: testManagerId,
        due_date: new Date('2023-12-31')
      })
      .returning()
      .execute();
    testGoalId = goalResult[0].id;

    // Update test input with actual user ID
    testInput.employee_id = testUserId;
  });

  afterEach(resetDB);

  it('should create an achievement without goal association', async () => {
    const input = { ...testInput, goal_id: null };
    const result = await createAchievement(input);

    // Verify returned data
    expect(result.title).toEqual('Completed Sales Goal');
    expect(result.description).toEqual(testInput.description);
    expect(result.category).toEqual('Goal_Completion');
    expect(result.employee_id).toEqual(testUserId);
    expect(result.goal_id).toBeNull();
    expect(result.achieved_date).toEqual(testInput.achieved_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an achievement with goal association', async () => {
    const input = { ...testInput, goal_id: testGoalId };
    const result = await createAchievement(input);

    // Verify returned data
    expect(result.title).toEqual('Completed Sales Goal');
    expect(result.description).toEqual(testInput.description);
    expect(result.category).toEqual('Goal_Completion');
    expect(result.employee_id).toEqual(testUserId);
    expect(result.goal_id).toEqual(testGoalId);
    expect(result.achieved_date).toEqual(testInput.achieved_date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save achievement to database', async () => {
    const input = { ...testInput, goal_id: testGoalId };
    const result = await createAchievement(input);

    // Query database directly
    const achievements = await db.select()
      .from(achievementsTable)
      .where(eq(achievementsTable.id, result.id))
      .execute();

    expect(achievements).toHaveLength(1);
    expect(achievements[0].title).toEqual('Completed Sales Goal');
    expect(achievements[0].description).toEqual(testInput.description);
    expect(achievements[0].category).toEqual('Goal_Completion');
    expect(achievements[0].employee_id).toEqual(testUserId);
    expect(achievements[0].goal_id).toEqual(testGoalId);
    expect(achievements[0].achieved_date).toEqual(testInput.achieved_date);
    expect(achievements[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different achievement categories', async () => {
    const categories = ['Skill_Development', 'Leadership', 'Innovation', 'Collaboration', 'Performance'] as const;
    
    for (const category of categories) {
      const input = { 
        ...testInput, 
        category,
        title: `Achievement - ${category}`,
        goal_id: null
      };
      const result = await createAchievement(input);
      
      expect(result.category).toEqual(category);
      expect(result.title).toEqual(`Achievement - ${category}`);
    }
  });

  it('should throw error when employee does not exist', async () => {
    const input = { ...testInput, employee_id: 99999, goal_id: null };
    
    await expect(createAchievement(input)).rejects.toThrow(/Employee with id 99999 not found/i);
  });

  it('should throw error when goal does not exist', async () => {
    const input = { ...testInput, goal_id: 99999 };
    
    await expect(createAchievement(input)).rejects.toThrow(/Goal with id 99999 not found/i);
  });

  it('should throw error when goal does not belong to employee', async () => {
    // Create another employee
    const otherEmployeeResult = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        first_name: 'Other',
        last_name: 'Employee',
        role: 'Employee',
        department: 'Marketing'
      })
      .returning()
      .execute();

    // Create goal for the other employee
    const otherGoalResult = await db.insert(goalsTable)
      .values({
        title: 'Marketing Goal',
        description: 'Complete marketing campaign',
        priority: 'Medium',
        employee_id: otherEmployeeResult[0].id
      })
      .returning()
      .execute();

    // Try to create achievement for testUserId but with other employee's goal
    const input = { ...testInput, goal_id: otherGoalResult[0].id };
    
    await expect(createAchievement(input)).rejects.toThrow(
      new RegExp(`Goal with id ${otherGoalResult[0].id} does not belong to employee ${testUserId}`, 'i')
    );
  });

  it('should handle past and future achievement dates', async () => {
    const pastDate = new Date('2023-01-15');
    const futureDate = new Date('2024-06-30');

    // Test past date
    const pastInput = { ...testInput, achieved_date: pastDate, goal_id: null };
    const pastResult = await createAchievement(pastInput);
    expect(pastResult.achieved_date).toEqual(pastDate);

    // Test future date
    const futureInput = { 
      ...testInput, 
      title: 'Future Achievement',
      achieved_date: futureDate, 
      goal_id: null 
    };
    const futureResult = await createAchievement(futureInput);
    expect(futureResult.achieved_date).toEqual(futureDate);
  });
});