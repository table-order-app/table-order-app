import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { routeConfig } from "./routes";
import AuthGuard from "./components/AuthGuard";
import "./App.css";

const App = () => {
  return (
    <div className="w-full h-full m-0 p-0 overflow-hidden">
      <Router>
        <AuthGuard>
          <Routes>
            {/* ルートパスはダッシュボードにリダイレクト */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {routeConfig.map((route) => {
              return (
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
              );
            })}
          </Routes>
        </AuthGuard>
      </Router>
    </div>
  );
};

export default App;
