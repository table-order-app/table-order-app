import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { routeConfig } from "./routes";
import MainLayout from "./layouts/MainLayout";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Routes>
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
                  <MainLayout>
                    <route.component />
                  </MainLayout>
                )
              }
            />
          );
        })}
      </Routes>
    </Router>
  );
};

export default App;
