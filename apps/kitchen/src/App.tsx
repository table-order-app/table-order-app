import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { routeConfig } from "./routes";
import AuthGuard from "./components/AuthGuard";
import "./App.css";

function App() {
  return (
    <div className="w-full h-full m-0 p-0 overflow-hidden">
      <Router>
        <AuthGuard>
          <Routes>
            {routeConfig.map((route) => {
              const Component = route.component;
              const Layout = route.layout;

              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    Layout ? (
                      <Layout>
                        <Component />
                      </Layout>
                    ) : (
                      <Component />
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
}

export default App;
