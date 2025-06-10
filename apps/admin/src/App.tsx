import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { routeConfig } from "./routes";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/AuthGuard";
import LoginPage from "./pages/auth/LoginPage";

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="w-full max-w-full overflow-hidden">
          <Routes>
            {/* ログインページ（認証不要） */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 認証が必要なルート */}
            {routeConfig.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <AuthGuard>
                    {route.layout ? (
                      <route.layout>
                        <route.component />
                      </route.layout>
                    ) : (
                      <route.component />
                    )}
                  </AuthGuard>
                }
              />
            ))}
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
