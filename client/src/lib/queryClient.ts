import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import { app } from "@/services/firebase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  
  // Get demo user from localStorage if no Firebase user
  const savedUser = localStorage.getItem('socialSphere_user');
  const demoUser = savedUser ? JSON.parse(savedUser) : null;
  
  const token = user ? await user.getIdToken() : (demoUser?.uid || 'demo-token');

  const headers: Record<string, string> = {};
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  headers["Authorization"] = `Bearer ${token}`;
  // Use Firebase user data if available, otherwise use demo user
  if (user?.uid) {
    headers["x-firebase-uid"] = user.uid;
    if (user?.email) headers["x-user-email"] = user.email as string;
  } else if (demoUser) {
    headers["x-firebase-uid"] = demoUser.uid;
    headers["x-user-email"] = demoUser.email;
  }

  const res = await fetch(`/api${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }: any) => {
    const auth = getAuth(app);
    const user = auth.currentUser;
    
    // Get demo user from localStorage if no Firebase user
    const savedUser = localStorage.getItem('socialSphere_user');
    const demoUser = savedUser ? JSON.parse(savedUser) : null;
    
    const token = user ? await user.getIdToken() : (demoUser?.uid || 'demo-token');

    const headers: Record<string, string> = {};
    headers["Authorization"] = `Bearer ${token}`;
    // Use Firebase user data if available, otherwise use demo user
    if (user?.uid) {
      headers["x-firebase-uid"] = user.uid;
      if (user?.email) headers["x-user-email"] = user.email as string;
    } else if (demoUser) {
      headers["x-firebase-uid"] = demoUser.uid;
      headers["x-user-email"] = demoUser.email;
    }

    const res = await fetch(`${queryKey.join("/")}`, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000, // 30 seconds for faster balance updates
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});
