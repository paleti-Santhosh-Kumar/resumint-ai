import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

type RouterContextValue = {
  path: string;
  navigate: (to: string) => void;
};

const RouterContext = createContext<RouterContextValue>({
  path: "/",
  navigate: () => {},
});

function currentHashPath(): string {
  const h = window.location.hash.replace(/^#/, "");
  return h.length > 0 ? h : "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() =>
    typeof window === "undefined" ? "/" : currentHashPath()
  );

  useEffect(() => {
    const onHash = () => setPath(currentHashPath());
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.replace("#/");
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((to: string) => {
    if (currentHashPath() === to) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.location.hash = to;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <RouterContext.Provider value={{ path, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children: ReactNode;
};

export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      href={`#${to}`}
      onClick={(e) => {
        e.preventDefault();
        onClick?.(e);
        navigate(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
