import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import Toast from "../components/Toast";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [type, setType] = useState<ToastType>("success");

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setMessage(message);
      setType(type);
      setIsVisible(true);
    },
    []
  );

  const hideToast = useCallback(() => {
    setIsVisible(false);
  }, []);

  const value = {
    showToast,
    hideToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toast
        message={message}
        type={type}
        isVisible={isVisible}
        onClose={hideToast}
        autoHideDuration={4000}
      />
    </ToastContext.Provider>
  );
};

export default ToastContext;
