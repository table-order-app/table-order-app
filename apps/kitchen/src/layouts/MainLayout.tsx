import { ReactNode } from "react";
import Navigation from "../components/Navigation";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
      <Navigation />
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
