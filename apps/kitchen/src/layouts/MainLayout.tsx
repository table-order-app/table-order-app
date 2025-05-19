import { ReactNode } from "react";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 overflow-hidden">
      {children}
    </div>
  );
};

export default MainLayout;
