/// <reference types="vite/client" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
  interface Element {}
  interface ElementClass {
    render: any;
  }
  interface ElementAttributesProperty {
    props: any;
  }
  interface ElementChildrenAttribute {
    children: any;
  }
}

declare namespace React {
  interface ChangeEvent<T = Element> {
    target: T;
    currentTarget: T;
  }
  
  interface FormEvent<T = Element> {
    preventDefault(): void;
  }
  
  type ReactNode = 
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactElement
    | React.ReactFragment
    | React.ReactPortal
    | Array<React.ReactNode>;
}

declare module '@table-order-system/ui' {
  export interface ButtonProps {
    label: string;
    variant?: 'primary' | 'secondary' | 'danger';
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    disabled?: boolean;
  }
  
  export const Button: React.FC<ButtonProps>;
}

declare module 'react' {
  export const useState: <T>(initialState: T | (() => T)) => [T, (newState: T | ((prevState: T) => T)) => void];
  export const useEffect: (effect: () => void | (() => void), deps?: ReadonlyArray<any>) => void;
  export const useCallback: <T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>) => T;
  export const useMemo: <T>(factory: () => T, deps: ReadonlyArray<any>) => T;
  export const useRef: <T>(initialValue: T) => { current: T };
  export const createContext: <T>(defaultValue: T) => React.Context<T>;
  export const useContext: <T>(context: React.Context<T>) => T;
  
  export interface FC<P = {}> {
    (props: P): React.ReactElement | null;
  }
  
  export interface ReactElement {}
  export interface ReactFragment {}
  export interface ReactPortal {}
  export interface Context<T> {}
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react-router' {
  export const BrowserRouter: React.FC<{ children?: React.ReactNode }>;
  export const Routes: React.FC<{ children?: React.ReactNode }>;
  export const Route: React.FC<{ path: string; element: React.ReactElement }>;
  export const useNavigate: () => (path: string, options?: { replace?: boolean; state?: any }) => void;
  export const useLocation: () => { pathname: string; search: string; hash: string; state: any };
  export const useParams: <T extends Record<string, string | undefined>>() => T;
  export const Link: React.FC<{ to: string; className?: string; children?: React.ReactNode }>;
  export const NavLink: React.FC<{ to: string; className?: string; children?: React.ReactNode }>;
  export const Outlet: React.FC;
}



