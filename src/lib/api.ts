const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost/nethras-backend";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export const apiGet = <T>(path: string) => request<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });
export const apiDelete = <T>(path: string) => request<T>(path, { method: "DELETE" });

// Uploads a file to /api/upload.php and returns the full absolute URL to store/display it.
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE_URL}/api/upload.php`, { method: "POST", body: form });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Upload failed (${res.status})`);
  }
  return `${BASE_URL}${data.path}`;
}

// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
export type ApiUser = {
  Userkey: string;
  FullName: string;
  Email: string;
  PhoneNumber: string | null;
  Role: "Customer" | "Admin" | "Staff";
  IsActive: number;
};

export const login = (email: string, password: string) =>
  apiPost<{ user: ApiUser; redirectTo: string }>("/auth/login.php", { email, password });

export const register = (fullName: string, email: string, phone: string, password: string) =>
  apiPost<{ user: ApiUser; redirectTo: string }>("/auth/register.php", {
    fullName,
    email,
    phone,
    password,
  });
