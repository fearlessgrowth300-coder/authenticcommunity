import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import HandoffApp from "../ui-handoff/src/App";

// The UX handoff is the active application surface. It supplies the complete
// mobile/desktop route set and realistic seeded content for product review.
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <HandoffApp />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
