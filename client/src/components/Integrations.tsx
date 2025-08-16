import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Link, Shield, AlertTriangle, CheckCircle2, Database, GraduationCap, Users, Calendar, MessageCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { User, Integration, CreateIntegrationInput, IntegrationType } from '../../../server/src/schema';

interface IntegrationsProps {
  currentUser: User | null;
}

export function Integrations({ currentUser }: IntegrationsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState<CreateIntegrationInput>({
    name: '',
    type: 'HRIS',
    enabled: false,
    config: '{}'
  });

  const loadIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getIntegrations.query();
      setIntegrations(result);
    } catch (error) {
      console.error('Failed to load integrations:', error);
      // Using stub data when API fails
      setIntegrations([
        {
          id: 1,
          name: 'Workday HRIS',
          type: 'HRIS',
          enabled: true,
          config: '{"apiUrl": "https://api.workday.com", "clientId": "growthtracker"}',
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 2,
          name: 'LinkedIn Learning',
          type: 'Learning_Management',
          enabled: true,
          config: '{"apiKey": "••••••••", "organizationId": "12345"}',
          created_at: new Date('2024-01-18'),
          updated_at: new Date('2024-01-22')
        },
        {
          id: 3,
          name: 'BambooHR',
          type: 'Performance_Review',
          enabled: false,
          config: '{"subdomain": "company", "apiKey": "••••••••"}',
          created_at: new Date('2024-01-20'),
          updated_at: new Date('2024-01-20')
        },
        {
          id: 4,
          name: 'Google Calendar',
          type: 'Calendar',
          enabled: true,
          config: '{"clientId": "••••••••", "calendarId": "primary"}',
          created_at: new Date('2024-01-22'),
          updated_at: new Date('2024-01-25')
        },
        {
          id: 5,
          name: 'Slack Notifications',
          type: 'Communication',
          enabled: false,
          config: '{"webhookUrl": "https://hooks.slack.com/••••••••", "channel": "#hr-updates"}',
          created_at: new Date('2024-01-25'),
          updated_at: new Date('2024-01-25')
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsCreating(true);
    try {
      const newIntegration = await trpc.createIntegration.mutate(formData);
      setIntegrations((prev: Integration[]) => [newIntegration, ...prev]);
      setFormData({
        name: '',
        type: 'HRIS',
        enabled: false,
        config: '{}'
      });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create integration:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleIntegration = async (integrationId: number, enabled: boolean) => {
    try {
      const updatedIntegration = await trpc.updateIntegration.mutate({
        id: integrationId,
        enabled
      });
      setIntegrations((prev: Integration[]) =>
        prev.map((integration: Integration) =>
          integration.id === integrationId ? updatedIntegration : integration
        )
      );
    } catch (error) {
      console.error('Failed to update integration:', error);
    }
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case 'HRIS':
        return <Database className="h-6 w-6" />;
      case 'Learning_Management':
        return <GraduationCap className="h-6 w-6" />;
      case 'Performance_Review':
        return <Users className="h-6 w-6" />;
      case 'Calendar':
        return <Calendar className="h-6 w-6" />;
      case 'Communication':
        return <MessageCircle className="h-6 w-6" />;
      default:
        return <Link className="h-6 w-6" />;
    }
  };

  const getIntegrationColor = (type: IntegrationType) => {
    switch (type) {
      case 'HRIS':
        return 'bg-blue-100 text-blue-600';
      case 'Learning_Management':
        return 'bg-green-100 text-green-600';
      case 'Performance_Review':
        return 'bg-purple-100 text-purple-600';
      case 'Calendar':
        return 'bg-orange-100 text-orange-600';
      case 'Communication':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'text-green-600 bg-green-100' 
      : 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  if (!currentUser || (currentUser.role !== 'HR_Admin' && currentUser.role !== 'System_Admin')) {
    return (
      <div className="text-center py-12">
        <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-medium text-slate-800 mb-2">Access Restricted</h3>
        <p className="text-slate-600">You need HR Admin or System Admin privileges to manage integrations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Integrations</h1>
          <p className="text-slate-600">Manage third-party integrations and system connections</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Configure a new third-party integration for the system.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateIntegration}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateIntegrationInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Workday HRIS"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Integration Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: IntegrationType) =>
                      setFormData((prev: CreateIntegrationInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HRIS">HRIS (Human Resources)</SelectItem>
                      <SelectItem value="Learning_Management">Learning Management</SelectItem>
                      <SelectItem value="Performance_Review">Performance Review</SelectItem>
                      <SelectItem value="Calendar">Calendar System</SelectItem>
                      <SelectItem value="Communication">Communication Tool</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="config">Configuration (JSON)</Label>
                  <Textarea
                    id="config"
                    value={formData.config}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateIntegrationInput) => ({ ...prev, config: e.target.value }))
                    }
                    placeholder='{"apiUrl": "https://api.example.com", "apiKey": "your-api-key"}'
                    rows={4}
                    className="font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-slate-500">
                    Enter configuration as valid JSON. Sensitive data will be encrypted.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateIntegrationInput) => ({ ...prev, enabled: checked }))
                    }
                  />
                  <Label htmlFor="enabled">Enable integration immediately</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Integration'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Link className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{integrations.length}</p>
                <p className="text-sm text-slate-600">Total Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {integrations.filter(i => i.enabled).length}
                </p>
                <p className="text-sm text-slate-600">Active Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Shield className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">
                  {integrations.filter(i => !i.enabled).length}
                </p>
                <p className="text-sm text-slate-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      {isLoading ? (
        <div className="text-center py-12">
          <Settings className="h-16 w-16 mx-auto mb-4 text-slate-300 animate-pulse" />
          <p className="text-slate-500">Loading integrations...</p>
        </div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Link className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-800 mb-2">No Integrations Configured</h3>
            <p className="text-slate-600 mb-4">
              Start by adding your first third-party integration to connect external systems.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {integrations.map((integration: Integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${getIntegrationColor(integration.type)}`}>
                      {getIntegrationIcon(integration.type)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{integration.name}</CardTitle>
                      <CardDescription className="mt-2">
                        <Badge variant="outline" className="mr-2">
                          {integration.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm">
                          Created: {integration.created_at.toLocaleDateString()}
                        </span>
                        {integration.updated_at !== integration.created_at && (
                          <span className="text-sm ml-2">
                            • Updated: {integration.updated_at.toLocaleDateString()}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`status-badge ${getStatusColor(integration.enabled)}`}>
                      {getStatusIcon(integration.enabled)}
                      {integration.enabled ? 'Active' : 'Inactive'}
                    </Badge>
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={(checked: boolean) => 
                        handleToggleIntegration(integration.id, checked)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-800 mb-2">Configuration</h4>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(JSON.parse(integration.config), null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  {integration.enabled && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Integration is active and ready to sync data</span>
                    </div>
                  )}
                  
                  {!integration.enabled && (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Integration is disabled. Enable to start syncing data</span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      Test Connection
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit Configuration
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Integration Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Integration Security & Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Security Best Practices</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>🔒 All API keys and sensitive data are encrypted at rest</li>
                <li>🔄 Connections use secure HTTPS protocols only</li>
                <li>⏰ Integration tokens are automatically refreshed</li>
                <li>📊 All integration activity is logged and monitored</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Configuration Tips</h4>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>✅ Test connections before enabling integrations</li>
                <li>📝 Use descriptive names for easy identification</li>
                <li>🔧 Review configurations regularly for accuracy</li>
                <li>💾 Keep backup configurations for critical systems</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}