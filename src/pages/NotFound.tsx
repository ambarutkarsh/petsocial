import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <span className="text-6xl block mb-4">🦕</span>
        <h1 className="mb-4 text-4xl font-heading font-bold text-primary">404</h1>
        <p className="mb-4 text-xl text-muted-foreground font-body">Oops! Page not found</p>
        <a href="/" className="text-primary font-heading font-bold underline hover:text-primary-dark">
          Return to Petosauras
        </a>
      </div>
    </div>
  );
};

export default NotFound;
