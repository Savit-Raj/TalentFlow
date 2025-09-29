/**
 * Header Component for TalentFlow
 * Professional navigation bar with branding and navigation links
 * 
 * Features:
 * - Professional branding with gradient logo
 * - Clean navigation with active state indicators
 * - Responsive design for mobile and desktop
 * - Modern glass morphism effect
 */

import { NavLink } from 'react-router-dom';
import { Briefcase, Users, ClipboardList, Building, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import buttonExports from '@/components/ui/button';
const { Button } = buttonExports;

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  
  const navItems = [
    { to: '/jobs', label: 'Jobs', icon: Briefcase },
    { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/assessments', label: 'Assessments', icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <NavLink to="/" className="flex items-center space-x-3 group">
          <div className="relative">
            <Building className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
            <div className="absolute -inset-1 bg-gradient-primary rounded-full opacity-20 blur-sm group-hover:opacity-30 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold gradient-text">TalentFlow</h1>
            <p className="text-xs text-muted-foreground -mt-1">Hiring Platform</p>
          </div>
        </NavLink>

        {/* Navigation */}
        <nav className="flex items-center space-x-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Theme Toggle & User Profile */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-8 w-8 p-0"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          
          <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">HR</span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">HR Manager</p>
            <p className="text-xs text-muted-foreground">admin@talentflow.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;