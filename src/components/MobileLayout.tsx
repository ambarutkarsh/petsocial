import { ReactNode } from "react";

interface MobileLayoutProps {
  children: ReactNode;
  className?: string;
}

const MobileLayout = ({ children, className = "" }: MobileLayoutProps) => {
  return (
    <div className="min-h-screen bg-muted/30 flex justify-center">
      <div className={`paw-container ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default MobileLayout;
