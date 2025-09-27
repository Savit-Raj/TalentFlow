/**
 * Main Layout Component for TalentFlow
 * Provides consistent layout structure across all pages
 * 
 * Features:
 * - Header with navigation
 * - Main content area with proper spacing
 * - Background gradient for visual appeal
 * - Toast notifications support
 * - Responsive design
 */

import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>
    </div>
  );
};

export default Layout;