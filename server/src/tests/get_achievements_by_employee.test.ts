import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, goalsTable, achievementsTable } from '../db/schema';
import { type CreateUserInput, type CreateGoalInput, type CreateAchievementInput } from '../schema';
import { getAchievementsByEmployee } from '../handlers/get_achievements_by_employee';

// Test data
const testManager: CreateUserInput = {
  email: 'manager@test.com',
  first_name: 'Manager',
  last_name: 'User',
  role: 'Manager',
  department: 'Engineering',
  manager_id: null,
  profile_picture: null
};

const testEmployee: CreateUserInput = {
  email: 'employee@test.com',
  first_name: 'Test',
  last_name: 'Employee',
  role: 'Employee',
  department: 'Engineering',
  manager_id: null, // Will be set after manager is created
  profile_picture: null
};

const testGoal: CreateGoalInput = {
  title: 'Complete Project',
  description: 'Finish the assigned project',
  priority: 'High',
  employee_id: 0, // Will be set after employee is created
  manager_id: null, // Will be set after manager is created
  due_date: new Date('2024-12-31')
};

const testAchievement1: CreateAchievementInput = {
  title: 'Project Completed',
  description: 'Successfully completed the assigned project',
  category: 'Goal_Completion',
  employee_id: 0, // Will be set after employee is created
  goal_id: null, // Will be set after goal is created
  achieved_date: new Date('2024-01-15')
};

const testAchievement2: CreateAchievementInput = {
  title: 'Leadership Award',
  description: 'Demonstrated exceptional leadership skills',
  category: 'Leadership',
  employee_id: 0, // Will be set after employee is created
  goal_id: null,
  achieved_date: new Date('2024-02-20')
};

const testAchievement3: CreateAchievementInput = {
  title: 'Innovation Prize',
  description: 'Innovative solution to complex problem',
  category: 'Innovation',
  employee_id: 0, // Will be set after employee is created
  goal_id: null,
  achieved_date: new Date('2024-03-10')
};

describe('getAchievementsByEmployee', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when employee has no achievements', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee
    const employeeResult = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    const result = await getAchievementsByEmployee(employeeId);

    expect(result).toEqual([]);
  });

  it('should return all achievements for a specific employee', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee
    const employeeResult = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    // Create goal
    const goalResult = await db.insert(goalsTable)
      .values({ ...testGoal, employee_id: employeeId, manager_id: managerId })
      .returning()
      .execute();
    const goalId = goalResult[0].id;

    // Create achievements
    await db.insert(achievementsTable)
      .values([
        { ...testAchievement1, employee_id: employeeId, goal_id: goalId },
        { ...testAchievement2, employee_id: employeeId },
        { ...testAchievement3, employee_id: employeeId }
      ])
      .execute();

    const result = await getAchievementsByEmployee(employeeId);

    expect(result).toHaveLength(3);
    
    // Verify achievements are returned with correct data
    const achievementTitles = result.map(a => a.title);
    expect(achievementTitles).toContain('Project Completed');
    expect(achievementTitles).toContain('Leadership Award');
    expect(achievementTitles).toContain('Innovation Prize');

    // Verify all achievements belong to the correct employee
    result.forEach(achievement => {
      expect(achievement.employee_id).toBe(employeeId);
      expect(achievement.id).toBeDefined();
      expect(achievement.created_at).toBeInstanceOf(Date);
      expect(achievement.achieved_date).toBeInstanceOf(Date);
    });
  });

  it('should return achievements ordered by achieved_date descending (most recent first)', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee
    const employeeResult = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    // Create achievements with different achieved dates
    await db.insert(achievementsTable)
      .values([
        { ...testAchievement1, employee_id: employeeId }, // 2024-01-15
        { ...testAchievement2, employee_id: employeeId }, // 2024-02-20
        { ...testAchievement3, employee_id: employeeId }  // 2024-03-10
      ])
      .execute();

    const result = await getAchievementsByEmployee(employeeId);

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first (2024-03-10, 2024-02-20, 2024-01-15)
    expect(result[0].title).toBe('Innovation Prize'); // 2024-03-10
    expect(result[1].title).toBe('Leadership Award'); // 2024-02-20
    expect(result[2].title).toBe('Project Completed'); // 2024-01-15

    // Verify dates are in descending order
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].achieved_date >= result[i + 1].achieved_date).toBe(true);
    }
  });

  it('should not return achievements for other employees', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create first employee
    const employee1Result = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employee1Id = employee1Result[0].id;

    // Create second employee
    const employee2Result = await db.insert(usersTable)
      .values({ 
        ...testEmployee, 
        email: 'employee2@test.com',
        first_name: 'Second',
        manager_id: managerId 
      })
      .returning()
      .execute();
    const employee2Id = employee2Result[0].id;

    // Create achievements for both employees
    await db.insert(achievementsTable)
      .values([
        { ...testAchievement1, employee_id: employee1Id },
        { ...testAchievement2, employee_id: employee1Id },
        { ...testAchievement3, employee_id: employee2Id } // Different employee
      ])
      .execute();

    const result = await getAchievementsByEmployee(employee1Id);

    expect(result).toHaveLength(2);
    
    // Verify all returned achievements belong to employee1
    result.forEach(achievement => {
      expect(achievement.employee_id).toBe(employee1Id);
    });
    
    const achievementTitles = result.map(a => a.title);
    expect(achievementTitles).toContain('Project Completed');
    expect(achievementTitles).toContain('Leadership Award');
    expect(achievementTitles).not.toContain('Innovation Prize'); // Belongs to employee2
  });

  it('should handle achievements with different categories', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee
    const employeeResult = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    // Create achievements with different categories
    const achievementCategories = [
      'Goal_Completion',
      'Skill_Development', 
      'Leadership',
      'Innovation',
      'Collaboration',
      'Performance'
    ];

    const achievements = achievementCategories.map((category, index) => ({
      title: `${category} Achievement`,
      description: `Achievement in ${category}`,
      category: category as any,
      employee_id: employeeId,
      goal_id: null,
      achieved_date: new Date(`2024-01-${10 + index}`)
    }));

    await db.insert(achievementsTable)
      .values(achievements)
      .execute();

    const result = await getAchievementsByEmployee(employeeId);

    expect(result).toHaveLength(6);
    
    // Verify all categories are represented
    const resultCategories = result.map(a => a.category);
    achievementCategories.forEach(category => {
      expect(resultCategories).toContain(category);
    });
  });

  it('should handle achievements linked to goals', async () => {
    // Create manager first
    const managerResult = await db.insert(usersTable)
      .values(testManager)
      .returning()
      .execute();
    const managerId = managerResult[0].id;

    // Create employee
    const employeeResult = await db.insert(usersTable)
      .values({ ...testEmployee, manager_id: managerId })
      .returning()
      .execute();
    const employeeId = employeeResult[0].id;

    // Create goal
    const goalResult = await db.insert(goalsTable)
      .values({ ...testGoal, employee_id: employeeId, manager_id: managerId })
      .returning()
      .execute();
    const goalId = goalResult[0].id;

    // Create achievement linked to goal
    await db.insert(achievementsTable)
      .values({
        ...testAchievement1,
        employee_id: employeeId,
        goal_id: goalId
      })
      .execute();

    const result = await getAchievementsByEmployee(employeeId);

    expect(result).toHaveLength(1);
    expect(result[0].goal_id).toBe(goalId);
    expect(result[0].employee_id).toBe(employeeId);
  });
});