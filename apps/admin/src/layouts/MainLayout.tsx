import { ReactNode } from "react";

type MainLayoutProps = {
  children: ReactNode;
};

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-100 w-full max-w-full overflow-x-hidden">
      <main className="min-h-screen py-8 w-full max-w-full">
        <div className="px-4 w-full full-width-container">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;
