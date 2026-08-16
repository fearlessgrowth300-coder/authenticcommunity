import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportClientError } from "@/lib/analytics";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    void reportClientError(error, info.componentStack?.slice(0, 1000) || "react_error_boundary");
  }

  render() {
    if (this.state.failed) {
      return <main className="min-h-screen grid place-items-center bg-background px-6 text-center"><div><h1 className="text-xl font-bold">Something went wrong</h1><p className="mt-2 text-sm text-muted-foreground">We logged the problem. Please refresh and try again.</p></div></main>;
    }
    return this.props.children;
  }
}
