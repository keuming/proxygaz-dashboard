const API_URL = import.meta.env.VITE_API_URL || "https://proxygaz-backend.vercel.app";

function getToken(): string | null {
  return localStorage.getItem("proxigaz_admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("proxigaz_admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("proxigaz_admin_token");
}

interface TrpcErrorShape {
  error: { message: string; code?: string };
}

async function handleResponse(res: Response) {
  const json = await res.json();
  if (!res.ok) {
    const shape = json as TrpcErrorShape;
    throw new Error(shape.error?.message || "Erreur inconnue");
  }
  return json.result.data;
}

/** Requête tRPC de type "query" (lecture) — envoyée en GET avec l'input encodé en query string. */
export async function trpcQuery<T = unknown>(path: string, input?: unknown): Promise<T> {
  const url = new URL(`${API_URL}/api/trpc/${path}`);
  if (input !== undefined) {
    url.searchParams.set("input", JSON.stringify(input));
  }

  const token = getToken();
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return handleResponse(res);
}

/** Requête tRPC de type "mutation" (écriture) — envoyée en POST. */
export async function trpcMutation<T = unknown>(path: string, input?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/trpc/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(input ?? {}),
  });
  return handleResponse(res);
}
