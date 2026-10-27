"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api, SOCKET_URL, mutate } from "./api";
import type { User, SocketEvent } from "./types";
interface AppContext {
  user: User | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  requireAuth: () => boolean;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  toast: (message: string) => void;
  socket: WebSocket | null;
  socketEvent: SocketEvent | null;
  unread: number;
  setUnread: (value: number) => void;
}
const Context = createContext<AppContext | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null),
    [authLoading, setLoading] = useState(true),
    [authOpen, setAuthOpen] = useState(false),
    [message, setMessage] = useState(""),
    [socket, setSocket] = useState<WebSocket | null>(null),
    [socketEvent, setSocketEvent] = useState<SocketEvent | null>(null),
    [unread, setUnread] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toast = useCallback((text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(""), 4500);
  }, []);
  const refreshUser = useCallback(async () => {
    try {
      const result = await api<{ user: User }>("/auth/me");
      setUser(result.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme =
      localStorage.getItem("ps-theme") || "light";
    void refreshUser();
  }, [refreshUser]);
  useEffect(() => {
    if (!user) return;
    let connection: WebSocket | undefined;
    let stopped = false;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const connect = async () => {
      try {
        const { ticket } = await mutate<{ ticket: string }>("/auth/ws-ticket");
        if (stopped) return;
        connection = new WebSocket(
          `${SOCKET_URL}/ws?ticket=${encodeURIComponent(ticket)}`,
        );
        connection.onopen = () => {
          attempt = 0;
          setSocket(connection ?? null);
        };
        connection.onmessage = (event) => {
          try {
            const data = JSON.parse(String(event.data)) as SocketEvent;
            setSocketEvent(data);
            if (data.type === "notification") setUnread((n) => n + 1);
          } catch {
            /* malformed frames cannot alter application state */
          }
        };
        connection.onclose = () => {
          setSocket(null);
          if (!stopped)
            reconnect = setTimeout(
              () => void connect(),
              Math.min(30000, 1000 * 2 ** attempt++),
            );
        };
      } catch {
        if (!stopped) reconnect = setTimeout(() => void connect(), 15000);
      }
    };
    void connect();
    void api<{ items: { readAt?: string }[] }>("/notifications")
      .then((result) =>
        setUnread(result.items.filter((item) => !item.readAt).length),
      )
      .catch(() => undefined);
    return () => {
      stopped = true;
      clearTimeout(reconnect);
      connection?.close();
      setSocket(null);
    };
  }, [user?.id]);
  const requireAuth = useCallback(() => {
    if (user) return true;
    setAuthOpen(true);
    return false;
  }, [user]);
  return (
    <Context.Provider
      value={{
        user,
        authLoading,
        refreshUser,
        setUser,
        requireAuth,
        authOpen,
        setAuthOpen,
        toast,
        socket,
        socketEvent,
        unread,
        setUnread,
      }}
    >
      {children}
      {message && (
        <div className="toast" role="status">
          {message}
          <button
            onClick={() => setMessage("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </Context.Provider>
  );
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider is required");
  return value;
}
