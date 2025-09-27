import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import ButtonExports from '@/components/ui/button';

const { Button } = ButtonExports;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <div className="space-y-2">
          <p className="text-xl text-muted-foreground">Oops! Page not found</p>
          <p className="text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
        </div>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;