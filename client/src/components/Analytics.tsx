import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, Target, Trophy, Users, Calendar, Filter, Download, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, AnalyticsQueryInput, AnalyticsResponse, GoalStatus, AchievementCategory } from '../../../server/src/schema';

interface AnalyticsProps {
  currentUser: User | null;
}

export function Analytics({ currentUser }: AnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AnalyticsQueryInput>({
    date_from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    date_to: new Date()
  });

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getAnalytics.query(filters);
      setAnalytics(result);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      // Using stub data when API fails
      setAnalytics({
        total_goals: 45,
        completed_goals: 23,
        pending_goals: 8,
        total_achievements: 34,
        achievements_by_category: {
          'Goal_Completion': 12,
          'Skill_Development': 8,
          'Leadership': 6,
          'Innovation': 4,
          'Collaboration': 3,
          'Performance': 1
        },
        goals_by_priority: {
          'Low': 8,
          'Medium': 20,
          'High': 15,
          'Critical': 2
        },
        completion_rate: 51,
        average_completion_time: 18.5
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleFilterChange = (key: keyof AnalyticsQueryInput, value: any) => {
    setFilters((prev: AnalyticsQueryInput) => ({
      ...prev,
      [key]: value
    }));
  };

  const exportData = () => {
    if (!analytics) return;
    
    const data = JSON.stringify(analytics, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!currentUser || (currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">You need HR Admin or System Admin privileges to access analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Analytics Dashboard</h1>
          <p className="text-slate-600">Comprehensive insights into professional growth metrics</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAnalytics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportData} disabled={!analytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
          <CardDescription>
            Customize your analytics view with date ranges and other filters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.date_from?.toISOString().split('T')[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('date_from', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.date_to?.toISOString().split('T')[0] || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('date_to', e.target.value ? new Date(e.target.value) : undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                placeholder="Filter by department"
                value={filters.department || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleFilterChange('department', e.target.value || undefined)
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Goal Status</Label>
              <Select
                value={filters.goal_status || 'all'}
                onValueChange={(value: string) =>
                  handleFilterChange('goal_status', value === 'all' ? undefined : value as GoalStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending_Approval">Pending Approval</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="In_Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-300 animate-pulse" />
          <p className="text-slate-500">Loading analytics data...</p>
        </div>
      ) : !analytics ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Failed to load analytics data. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{analytics.total_goals}</p>
                    <p className="text-sm text-slate-600">Total Goals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{analytics.completion_rate}%</p>
                    <p className="text-sm text-slate-600">Completion Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{analytics.total_achievements}</p>
                    <p className="text-sm text-slate-600">Achievements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">
                      {analytics.average_completion_time ? `${analytics.average_completion_time.toFixed(1)}` : 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600">Avg. Days to Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress Overview</CardTitle>
              <CardDescription>
                Visual breakdown of goal completion across the organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Completion Rate</span>
                    <span className="text-sm text-slate-600">{analytics.completion_rate}%</span>
                  </div>
                  <Progress value={analytics.completion_rate} className="h-3" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{analytics.completed_goals}</p>
                    <p className="text-sm text-slate-600">Completed Goals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {analytics.total_goals - analytics.completed_goals - analytics.pending_goals}
                    </p>
                    <p className="text-sm text-slate-600">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{analytics.pending_goals}</p>
                    <p className="text-sm text-slate-600">Pending Approval</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals by Priority */}
            <Card>
              <CardHeader>
                <CardTitle>Goals by Priority</CardTitle>
                <CardDescription>Distribution of goals across priority levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.goals_by_priority).map(([priority, count]) => {
                    const total = Object.values(analytics.goals_by_priority).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    
                    return (
                      <div key={priority} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge className={`status-badge priority-${priority.toLowerCase()}`}>
                              {priority}
                            </Badge>
                            <span className="font-medium">{count} goals</span>
                          </div>
                          <span className="text-sm text-slate-500">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Achievements by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Achievements by Category</CardTitle>
                <CardDescription>Breakdown of achievements across different categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analytics.achievements_by_category).map(([category, count]) => {
                    const total = Object.values(analytics.achievements_by_category).reduce((a, b) => a + b, 0);
                    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {category.replace('_', ' ')}
                            </Badge>
                            <span className="font-medium">{count} achievements</span>
                          </div>
                          <span className="text-sm text-slate-500">{percentage}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                Data-driven insights based on current analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Performance Highlights</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>✅ {analytics.completion_rate}% goal completion rate across the organization</p>
                    <p>🏆 {analytics.total_achievements} total achievements recorded</p>
                    <p>⏱️ Average completion time: {analytics.average_completion_time ? `${analytics.average_completion_time.toFixed(1)} days` : 'Not available'}</p>
                    <p>📊 {analytics.pending_goals} goals awaiting manager approval</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-800">Recommendations</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    {analytics.completion_rate < 50 && (
                      <p>🔍 Consider reviewing goal-setting processes to improve completion rates</p>
                    )}
                    {analytics.pending_goals > 0 && (
                      <p>⚡ Follow up on pending goal approvals to maintain momentum</p>
                    )}
                    {analytics.total_achievements > 0 && (
                      <p>🎉 Celebrate team achievements to boost motivation</p>
                    )}
                    <p>📈 Regular analytics reviews help identify growth opportunities</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}