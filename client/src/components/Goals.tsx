import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Plus, Filter, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

// Local type definitions
type UserRole = 'Employee' | 'Manager' | 'HR_Admin' | 'System_Admin';
type GoalStatus = 'Draft' | 'Pending_Approval' | 'Approved' | 'In_Progress' | 'Completed' | 'Cancelled';
type GoalPriority = 'Low' | 'Medium' | 'High' | 'Critical';

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

interface GoalsProps {
  currentUser: User | null;
}

export function Goals({ currentUser }: GoalsProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState<'all' | GoalStatus>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | GoalPriority>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium' as GoalPriority,
    due_date: null as Date | null
  });

  const loadGoals = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Mock goals data
      const mockGoals: Goal[] = [
        {
          id: 1,
          title: 'Complete React Training',
          description: 'Finish the advanced React course and implement learned concepts in current projects',
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
          description: 'Take leadership role in daily team standup meetings for Q1',
          status: 'Completed',
          priority: 'Medium',
          employee_id: currentUser.id,
          manager_id: 2,
          due_date: new Date('2024-02-28'),
          completed_date: new Date('2024-02-25'),
          approval_date: new Date('2024-01-20'),
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-02-25')
        },
        {
          id: 3,
          title: 'Attend Tech Conference',
          description: 'Participate in industry conference for professional development',
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
      ];
      
      setGoals(mockGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsCreating(true);
    try {
      const newGoal: Goal = {
        id: goals.length + 1,
        title: formData.title,
        description: formData.description,
        status: 'Draft',
        priority: formData.priority,
        employee_id: currentUser.id,
        manager_id: currentUser.manager_id,
        due_date: formData.due_date,
        completed_date: null,
        approval_date: null,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      setGoals(prev => [newGoal, ...prev]);
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        due_date: null
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create goal:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateGoalStatus = async (goalId: number, status: GoalStatus) => {
    try {
      setGoals(prev => 
        prev.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                status, 
                completed_date: status === 'Completed' ? new Date() : goal.completed_date,
                updated_at: new Date() 
              } 
            : goal
        )
      );
    } catch (error) {
      console.error('Failed to update goal status:', error);
    }
  };

  const getStatusBadgeClass = (status: GoalStatus) => {
    return `status-badge status-${status.toLowerCase().replace('_', '-')}`;
  };

  const getPriorityBadgeClass = (priority: GoalPriority) => {
    return `status-badge priority-${priority.toLowerCase()}`;
  };

  const getStatusIcon = (status: GoalStatus) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'Cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'In_Progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-slate-600" />;
    }
  };

  const filteredGoals = goals.filter((goal: Goal) => {
    const statusMatch = filter === 'all' || goal.status === filter;
    const priorityMatch = priorityFilter === 'all' || goal.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const goalsByStatus = {
    all: goals.length,
    Draft: goals.filter(g => g.status === 'Draft').length,
    Pending_Approval: goals.filter(g => g.status === 'Pending_Approval').length,
    Approved: goals.filter(g => g.status === 'Approved').length,
    In_Progress: goals.filter(g => g.status === 'In_Progress').length,
    Completed: goals.filter(g => g.status === 'Completed').length,
    Cancelled: goals.filter(g => g.status === 'Cancelled').length
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Please sign in to view your goals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Goals</h1>
          <p className="text-slate-600">Track and manage your professional goals</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Set a new professional goal to track your progress.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGoal}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter goal title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your goal in detail"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: GoalPriority) =>
                      setFormData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date (Optional)</Label>
                  <Input
                    id="due_date"
                    type="date"
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        due_date: e.target.value ? new Date(e.target.value) : null
                      }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(goalsByStatus).map(([status, count]) => (
          <Card key={status} className="text-center">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-600 capitalize">
                {status === 'all' ? 'All Goals' : status.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading goals...</p>
        </div>
      ) : filteredGoals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Goals Found</h3>
            <p className="text-slate-600 mb-4">Start by creating your first professional goal!</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredGoals.map((goal: Goal) => (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(goal.status)}
                    <div>
                      <CardTitle className="text-xl">{goal.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {goal.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityBadgeClass(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    <Badge className={getStatusBadgeClass(goal.status)}>
                      {goal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    {goal.due_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Due: {goal.due_date.toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Created: {goal.created_at.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {goal.status === 'Draft' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateGoalStatus(goal.id, 'Pending_Approval')}
                      >
                        Submit for Approval
                      </Button>
                    )}
                    {goal.status === 'Approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateGoalStatus(goal.id, 'In_Progress')}
                      >
                        Start Progress
                      </Button>
                    )}
                    {goal.status === 'In_Progress' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateGoalStatus(goal.id, 'Completed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}