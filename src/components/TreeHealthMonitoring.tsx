import { 
  TreePine, 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Activity,
  Droplets,
  Bug,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TreeData {
  id: string;
  location: string;
  species: 'apple' | 'pear';
  health: number;
  status: 'healthy' | 'warning' | 'critical';
  sapFlow: number;
  leafMoisture: number;
  pestActivity: number;
  lastInspection: string;
  issues: string[];
}

const TreeHealthMonitoring = () => {
  const [trees] = useState<TreeData[]>([
    {
      id: 'apple-001',
      location: 'Row 1, Position 5',
      species: 'apple',
      health: 94,
      status: 'healthy',
      sapFlow: 85,
      leafMoisture: 78,
      pestActivity: 2,
      lastInspection: '2 hours ago',
      issues: []
    },
    {
      id: 'apple-002',
      location: 'Row 2, Position 12',
      species: 'apple',
      health: 67,
      status: 'warning',
      sapFlow: 62,
      leafMoisture: 58,
      pestActivity: 15,
      lastInspection: '1 hour ago',
      issues: ['Possible aphid infestation', 'Lower sap flow than normal']
    },
    {
      id: 'pear-001',
      location: 'Row 5, Position 8',
      species: 'pear',
      health: 88,
      status: 'healthy',
      sapFlow: 92,
      leafMoisture: 82,
      pestActivity: 1,
      lastInspection: '30 mins ago',
      issues: []
    },
    {
      id: 'apple-003',
      location: 'Row 3, Position 20',
      species: 'apple',
      health: 45,
      status: 'critical',
      sapFlow: 35,
      leafMoisture: 42,
      pestActivity: 28,
      lastInspection: '15 mins ago',
      issues: ['Fire blight detected', 'Severe dehydration', 'Heavy pest pressure']
    }
  ]);

  const [overallStats] = useState({
    totalTrees: 450,
    healthyTrees: 387,
    warningTrees: 52,
    criticalTrees: 11,
    averageHealth: 82,
    inspectionsToday: 127
  });

  // status color computed inline via icons

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSpeciesColor = (species: string) => {
    return species === 'apple' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Trees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {overallStats.totalTrees}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Under monitoring</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {overallStats.healthyTrees}
            </div>
            <Progress value={(overallStats.healthyTrees / overallStats.totalTrees) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Warning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-500">
              {overallStats.warningTrees}
            </div>
            <Progress value={(overallStats.warningTrees / overallStats.totalTrees) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {overallStats.criticalTrees}
            </div>
            <Progress value={(overallStats.criticalTrees / overallStats.totalTrees) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="glass-card border-lime-500/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Avg Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent-blue">
              {overallStats.averageHealth}%
            </div>
            <Progress value={overallStats.averageHealth} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="individual">Individual Trees</TabsTrigger>
          <TabsTrigger value="trends">Health Trends</TabsTrigger>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle>Tree Health Status</CardTitle>
              <CardDescription>Individual tree monitoring and health assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trees.map((tree) => (
                  <div key={tree.id} className="border border-border rounded-lg p-4 bg-gradient-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <TreePine className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{tree.id}</h4>
                          <p className="text-sm text-muted-foreground">{tree.location}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getSpeciesColor(tree.species)}>
                              {tree.species}
                            </Badge>
                            {getStatusIcon(tree.status)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {tree.health}%
                        </div>
                        <p className="text-sm text-muted-foreground">Health Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Activity className="h-4 w-4 text-accent-blue mr-1" />
                          <span className="text-sm font-medium">Sap Flow</span>
                        </div>
                        <div className="text-lg font-bold">{tree.sapFlow}%</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Droplets className="h-4 w-4 text-accent-blue mr-1" />
                          <span className="text-sm font-medium">Moisture</span>
                        </div>
                        <div className="text-lg font-bold">{tree.leafMoisture}%</div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Bug className="h-4 w-4 text-accent-orange mr-1" />
                          <span className="text-sm font-medium">Pests</span>
                        </div>
                        <div className="text-lg font-bold">{tree.pestActivity}</div>
                      </div>
                    </div>

                    {tree.issues.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium mb-2 text-yellow-500">Issues Detected:</h5>
                        <ul className="space-y-1">
                          {tree.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-yellow-500" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>Last inspection: {tree.lastInspection}</span>
                      </div>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle>Health Trends</CardTitle>
              <CardDescription>Long-term health patterns and predictions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Overall Health Improving</h3>
                <p className="text-muted-foreground mb-4">
                  Farm health has increased by 12% over the past month
                </p>
                <Button>View Detailed Analytics</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="glass-card border-lime-500/30">
            <CardHeader>
              <CardTitle>Active Health Alerts</CardTitle>
              <CardDescription>Trees requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trees.filter(tree => tree.status !== 'healthy').map((tree) => (
                  <div key={tree.id} className="border border-yellow-500/20 rounded-lg p-4 bg-yellow-500/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(tree.status)}
                          <h4 className="font-semibold">{tree.id}</h4>
                          <Badge variant="outline" className={tree.status === 'critical' ? 'border-red-500/20 text-red-500' : 'border-yellow-500/20 text-yellow-500'}>
                            {tree.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{tree.location}</p>
                        <ul className="space-y-1">
                          {tree.issues.map((issue, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold mb-2">{tree.health}%</div>
                        <Button size="sm">Take Action</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreeHealthMonitoring;