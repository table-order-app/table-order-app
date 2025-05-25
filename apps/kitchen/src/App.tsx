import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { routeConfig } from "./routes";
import "./App.css";

function App() {
  return (
    <div className="w-full h-full m-0 p-0 overflow-hidden">
      <Router>
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
      </Router>
    </div>
  );
}

export default App;
