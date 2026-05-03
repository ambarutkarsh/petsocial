import { Component, ReactNode } from "react";

interface State { hasError: boolean; error?: Error }

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-6">
          <div className="max-w-md text-center">
            <span className="text-5xl block mb-4">🐾</span>
            <h1 className="text-2xl font-heading font-bold text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-muted-foreground mb-6">
              We hit a snag loading Petosauras. Please refresh the page or try again shortly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
