import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Trophy, Plus, Filter, Calendar, Award, Star, Zap, Users2, Lightbulb, TrendingUp } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, Achievement, CreateAchievementInput, AchievementCategory } from '../../../server/src/schema';

interface AchievementsProps {
  currentUser: User | null;
}

export function Achievements({ currentUser }: AchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | AchievementCategory>('all');

  const [formData, setFormData] = useState<CreateAchievementInput>({
    title: '',
    description: '',
    category: 'Performance',
    employee_id: currentUser?.id || 0,
    goal_id: null,
    achieved_date: new Date()
  });

  const loadAchievements = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      const result = await trpc.getAchievementsByEmployee.query({ employeeId: currentUser.id });
      setAchievements(result);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsCreating(true);
    try {
      const newAchievement = await trpc.createAchievement.mutate({
        ...formData,
        employee_id: currentUser.id
      });
      setAchievements((prev: Achievement[]) => [newAchievement, ...prev]);
      setFormData({
        title: '',
        description: '',
        category: 'Performance',
        employee_id: currentUser.id,
        goal_id: null,
        achieved_date: new Date()
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create achievement:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const getCategoryIcon = (category: AchievementCategory) => {
    switch (category) {
      case 'Goal_Completion':
        return <Trophy className="h-5 w-5" />;
      case 'Skill_Development':
        return <Star className="h-5 w-5" />;
      case 'Leadership':
        return <Award className="h-5 w-5" />;
      case 'Innovation':
        return <Lightbulb className="h-5 w-5" />;
      case 'Collaboration':
        return <Users2 className="h-5 w-5" />;
      case 'Performance':
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: AchievementCategory) => {
    switch (category) {
      case 'Goal_Completion':
        return 'bg-green-100 text-green-800';
      case 'Skill_Development':
        return 'bg-blue-100 text-blue-800';
      case 'Leadership':
        return 'bg-purple-100 text-purple-800';
      case 'Innovation':
        return 'bg-yellow-100 text-yellow-800';
      case 'Collaboration':
        return 'bg-indigo-100 text-indigo-800';
      case 'Performance':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredAchievements = achievements.filter((achievement: Achievement) => {
    return categoryFilter === 'all' || achievement.category === categoryFilter;
  });

  const achievementsByCategory = {
    all: achievements.length,
    Goal_Completion: achievements.filter(a => a.category === 'Goal_Completion').length,
    Skill_Development: achievements.filter(a => a.category === 'Skill_Development').length,
    Leadership: achievements.filter(a => a.category === 'Leadership').length,
    Innovation: achievements.filter(a => a.category === 'Innovation').length,
    Collaboration: achievements.filter(a => a.category === 'Collaboration').length,
    Performance: achievements.filter(a => a.category === 'Performance').length
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Please sign in to view your achievements.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Achievements</h1>
          <p className="text-slate-600">Celebrate your professional milestones and accomplishments</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Record Achievement</DialogTitle>
              <DialogDescription>
                Document a new professional achievement or milestone.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAchievement}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAchievementInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter achievement title"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateAchievementInput) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe your achievement in detail"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: AchievementCategory) =>
                      setFormData((prev: CreateAchievementInput) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Goal_Completion">Goal Completion</SelectItem>
                      <SelectItem value="Skill_Development">Skill Development</SelectItem>
                      <SelectItem value="Leadership">Leadership</SelectItem>
                      <SelectItem value="Innovation">Innovation</SelectItem>
                      <SelectItem value="Collaboration">Collaboration</SelectItem>
                      <SelectItem value="Performance">Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="achieved_date">Achievement Date</Label>
                  <Input
                    id="achieved_date"
                    type="date"
                    value={formData.achieved_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAchievementInput) => ({
                        ...prev,
                        achieved_date: new Date(e.target.value)
                      }))
                    }
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Recording...' : 'Record Achievement'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Object.entries(achievementsByCategory).map(([category, count]) => (
          <Card key={category} className="text-center">
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-2">
                <div className={`p-2 rounded-lg ${getCategoryColor(category as AchievementCategory)}`}>
                  {getCategoryIcon(category as AchievementCategory)}
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-600 capitalize">
                {category === 'all' ? 'Total' : category.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select
              value={categoryFilter}
              onValueChange={(value: 'all' | AchievementCategory) => setCategoryFilter(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Goal_Completion">Goal Completion</SelectItem>
                <SelectItem value="Skill_Development">Skill Development</SelectItem>
                <SelectItem value="Leadership">Leadership</SelectItem>
                <SelectItem value="Innovation">Innovation</SelectItem>
                <SelectItem value="Collaboration">Collaboration</SelectItem>
                <SelectItem value="Performance">Performance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Timeline */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-slate-600">Loading achievements...</p>
        </div>
      ) : filteredAchievements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Achievements Yet</h3>
            <p className="text-slate-600 mb-4">
              {categoryFilter === 'all' 
                ? "Start recording your professional achievements and celebrate your progress!"
                : `No achievements found in the ${categoryFilter.replace('_', ' ')} category.`
              }
            </p>
            {categoryFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record Your First Achievement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-800">
            Achievement Timeline ({filteredAchievements.length})
          </h2>
          <div className="space-y-4">
            {filteredAchievements.map((achievement: Achievement) => (
              <Card key={achievement.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${getCategoryColor(achievement.category)}`}>
                      {getCategoryIcon(achievement.category)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{achievement.title}</CardTitle>
                          <CardDescription className="text-base">
                            {achievement.description}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {achievement.category.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Achieved: {achievement.achieved_date.toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4" />
                      Recorded: {achievement.created_at.toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Achievement Summary */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Achievement Journey</CardTitle>
            <CardDescription>
              You've recorded {achievements.length} achievements across {
                new Set(achievements.map(a => a.category)).size
              } different categories. Keep up the great work! 🎉
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}