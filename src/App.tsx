import { BrowserRouter } from "react-router-dom";
import HandoffApp from "../ui-handoff/src/App";

// The UX handoff is the active application surface. It supplies the complete
// mobile/desktop route set and realistic seeded content for product review.
export default function App() {
  return (
    <BrowserRouter>
      <HandoffApp />
    </BrowserRouter>
  );
}
