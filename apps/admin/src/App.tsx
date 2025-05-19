import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import { routeConfig } from "./routes";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
