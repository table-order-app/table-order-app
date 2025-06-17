import { BrowserRouter as Router, Routes, Route } from "react-router";
import "./index.css";
import { routeConfig } from "./routes";
import AuthGuard from "./components/AuthGuard";
import { ToastProvider } from "./components/ui/ToastContainer";

function App() {
  return (
    <ToastProvider>
      <Router>
        <AuthGuard>
          <div className="w-full max-w-full overflow-hidden">
            <Routes>
              {routeConfig.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    route.layout ? (
                      <route.layout>
                        <route.component />
                      </route.layout>
                    ) : (
                      <route.component />
                    )
                  }
                />
              ))}
            </Routes>
          </div>
        </AuthGuard>
      </Router>
    </ToastProvider>
  );
}

export default App;
