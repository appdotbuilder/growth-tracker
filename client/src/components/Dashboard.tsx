import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, Clock, Users, TrendingUp, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// Local type definitions to avoid build issues
type UserRole = 'Employee' | 'Manager' | 'HR_Admin' | 'System_Admin';
type GoalStatus = 'Draft' | 'Pending_Approval' | 'Approved' | 'In_Progress' | 'Completed' | 'Cancelled';
type GoalPriority = 'Low' | 'Medium' | 'High' | 'Critical';
type AchievementCategory = 'Goal_Completion' | 'Skill_Development' | 'Leadership' | 'Innovation' | 'Collaboration' | 'Performance';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string | null;
  manager_id: number | null;
  profile_picture: string | null;
  created_at: Date;
  updated_at: Date;
}

interface Goal {
  id: number;
  title: string;
  description: string;
  status: GoalStatus;
  priority: GoalPriority;
  employee_id: number;
  manager_id: number | null;
  due_date: Date | null;
  completed_date: Date | null;
  approval_date: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  category: AchievementCategory;
  employee_id: number;
  goal_id: number | null;
  achieved_date: Date;
  created_at: Date;
}

// Local type definition to avoid build issues with handler imports
interface DashboardData {
  user: User;
  recentGoals: Goal[];
  recentAchievements: Achievement[];
  pendingApprovals: Goal[];
  teamGoalsCount?: number;
  teamAchievementsCount?: number;
}

interface DashboardProps {
  currentUser: User | null;
  onNavigate: (page: string) => void;
}

export function Dashboard({ currentUser, onNavigate }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Mock data for demonstration (replace with real API calls when available)
      const mockData: DashboardData = {
        user: currentUser,
        recentGoals: [
          {
            id: 1,
            title: 'Complete React Training',
            description: 'Finish the advanced React course and implement learned concepts',
            status: 'In_Progress',
            priority: 'High',
            employee_id: currentUser.id,
            manager_id: 2,
            due_date: new Date('2024-03-15'),
            completed_date: null,
            approval_date: new Date('2024-02-01'),
            created_at: new Date('2024-01-15'),
            updated_at: new Date('2024-02-10')
          },
          {
            id: 2,
            title: 'Lead Team Standup',
            description: 'Take leadership role in daily team standup meetings',
            status: 'Completed',
            priority: 'Medium',
            employee_id: currentUser.id,
            manager_id: 2,
            due_date: new Date('2024-02-28'),
            completed_date: new Date('2024-02-25'),
            approval_date: new Date('2024-01-20'),
            created_at: new Date('2024-01-18'),
            updated_at: new Date('2024-02-25')
          }
        ],
        recentAchievements: [
          {
            id: 1,
            title: 'Mentorship Excellence',
            description: 'Successfully mentored 3 junior developers',
            category: 'Leadership',
            employee_id: currentUser.id,
            goal_id: null,
            achieved_date: new Date('2024-02-20'),
            created_at: new Date('2024-02-21')
          },
          {
            id: 2,
            title: 'Code Review Champion',
            description: 'Consistently provided high-quality code reviews',
            category: 'Performance',
            employee_id: currentUser.id,
            goal_id: 2,
            achieved_date: new Date('2024-02-15'),
            created_at: new Date('2024-02-16')
          }
        ],
        pendingApprovals: [
          {
            id: 3,
            title: 'Attend Tech Conference',
            description: 'Participate in industry conference for skill development',
            status: 'Pending_Approval',
            priority: 'Medium',
            employee_id: currentUser.id,
            manager_id: 2,
            due_date: new Date('2024-04-10'),
            completed_date: null,
            approval_date: null,
            created_at: new Date('2024-02-28'),
            updated_at: new Date('2024-02-28')
          }
        ],
        teamGoalsCount: 12,
        teamAchievementsCount: 8
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const getStatusBadgeClass = (status: string) => {
    return `status-badge status-${status.toLowerCase().replace('_', '-')}`;
  };

  const getPriorityBadgeClass = (priority: string) => {
    return `status-badge priority-${priority.toLowerCase()}`;
  };

  const completedGoals = dashboardData?.recentGoals.filter(goal => goal.status === 'Completed').length || 0;
  const totalGoals = dashboardData?.recentGoals.length || 0;
  const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Welcome back, {currentUser.first_name}! 👋
        </h1>
        <p className="text-slate-600 mt-2">
          Here's what's happening with your professional growth
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData?.recentGoals.length || 0}
                </p>
                <p className="text-sm text-slate-600">Active Goals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData?.recentAchievements.length || 0}
                </p>
                <p className="text-sm text-slate-600">Achievements</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {dashboardData?.pendingApprovals.length || 0}
                </p>
                <p className="text-sm text-slate-600">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(currentUser.role === 'Manager' || currentUser.role === 'HR_Admin') && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">
                    {dashboardData?.teamGoalsCount || 0}
                  </p>
                  <p className="text-sm text-slate-600">Team Goals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Goal Completion Rate
                </span>
                <span className="text-sm text-slate-600">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{completedGoals}</p>
                <p className="text-xs text-slate-600">Completed</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600">
                  {dashboardData?.recentGoals.filter(g => g.status === 'In_Progress').length || 0}
                </p>
                <p className="text-xs text-slate-600">In Progress</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-yellow-600">
                  {dashboardData?.pendingApprovals.length || 0}
                </p>
                <p className="text-xs text-slate-600">Pending</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Goals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Goals</CardTitle>
              <Button 
                size="sm" 
                onClick={() => onNavigate('goals')}
                className="text-xs"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentGoals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No goals yet. Start by creating your first goal!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.recentGoals.slice(0, 5).map((goal: Goal) => (
                  <div key={goal.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-800 truncate flex-1">
                        {goal.title}
                      </h4>
                      <Badge className={getStatusBadgeClass(goal.status)}>
                        {goal.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {goal.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge className={getPriorityBadgeClass(goal.priority)}>
                        {goal.priority}
                      </Badge>
                      {goal.due_date && (
                        <span className="text-xs text-slate-500">
                          Due: {goal.due_date.toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.recentAchievements.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No achievements yet. Complete some goals to earn achievements!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboardData?.recentAchievements.slice(0, 5).map((achievement: Achievement) => (
                  <div key={achievement.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg mt-0.5">
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-800">
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline">
                            {achievement.category.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {achievement.achieved_date.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}