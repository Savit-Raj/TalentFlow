/**
 * TalentFlow - Professional Hiring Platform
 * Modern dashboard showcasing the platform's capabilities
 * 
 * Features:
 * - Hero section with gradient background
 * - Feature cards highlighting key functionality
 * - Professional statistics display
 * - Call-to-action buttons
 * - Responsive design with animations
 */

import { NavLink } from 'react-router-dom';
import { ArrowRight, Briefcase, Users, ClipboardList, BarChart3, Zap, Shield } from 'lucide-react';
import ButtonExports from '@/components/ui/button';
const { Button } = ButtonExports;
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Index = () => {
  const features = [
    {
      icon: Briefcase,
      title: 'Jobs Management',
      description: 'Create, edit, and organize job postings with drag-and-drop reordering.',
      link: '/jobs',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      stats: '25+ Jobs',
    },
    {
      icon: Users,
      title: 'Candidate Pipeline',
      description: 'Track 1000+ candidates through hiring stages with kanban boards.',
      link: '/candidates',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      stats: '1000+ Candidates',
    },
    {
      icon: ClipboardList,
      title: 'Assessment Builder',
      description: 'Create dynamic forms with conditional logic and validation.',
      link: '/assessments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      stats: '10+ Question Types',
    },
  ];

  const highlights = [
    { icon: Zap, title: 'Real-time Updates', description: 'Optimistic UI with instant feedback' },
    { icon: Shield, title: 'Data Persistence', description: 'IndexedDB with offline support' },
    { icon: BarChart3, title: 'Advanced Analytics', description: 'Comprehensive reporting dashboard' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            🚀 Your Hiring Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to{' '}
            <span className="gradient-text">TalentFlow</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            A comprehensive hiring platform built with modern web technologies. 
            Manage jobs, track candidates, and create assessments with professional-grade tools.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <NavLink to="/jobs">
              Explore Jobs Board
              <ArrowRight className="ml-2 h-5 w-5" />
            </NavLink>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8">
            <NavLink to="/candidates">
              View Candidates
            </NavLink>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Platform Features</h2>
          <p className="text-muted-foreground text-lg">
            Professional tools for modern hiring teams
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, description, link, color, bgColor, stats }) => (
            <Card key={title} className="card-interactive group">
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {stats}
                  </Badge>
                </div>
                <CardDescription className="text-base">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <NavLink to={link}>
                    Explore
                    <ArrowRight className="h-4 w-4" />
                  </NavLink>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technical Highlights */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Technical Excellence</h2>
          <p className="text-muted-foreground text-lg">
            Built with modern web technologies and best practices
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-primary rounded-full flex items-center justify-center">
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Technology Stack</h2>
          <p className="text-muted-foreground text-lg">
            Powered by cutting-edge technologies
          </p>
        </div>

        <Card className="card-elevated">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">React</div>
                <p className="text-sm text-muted-foreground">Frontend Framework</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-500">TypeScript</div>
                <p className="text-sm text-muted-foreground">Type Safety</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-teal-600">Tailwind</div>
                <p className="text-sm text-muted-foreground">Styling</p>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-orange-600">IndexedDB</div>
                <p className="text-sm text-muted-foreground">Local Storage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-8 py-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore our comprehensive hiring platform and see how it can streamline your recruitment process.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8">
            <NavLink to="/jobs">
              Start with Jobs
              <ArrowRight className="ml-2 h-5 w-5" />
            </NavLink>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-lg px-8">
            <NavLink to="/assessments">
              Try Assessment Builder
            </NavLink>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;