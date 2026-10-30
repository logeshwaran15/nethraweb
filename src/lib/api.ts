const BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost/nethras-backend";
const TOKEN_STORAGE_KEY = "nethras_token";

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // storage unavailable — request() will just go out unauthenticated
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  // A 200 that isn't JSON means we reached a web page, not the API (e.g. the backend folder is missing).
  if (data === null) {
    throw new Error("The server did not return valid data. Please try again later.");
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
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/api/upload.php`, {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Upload failed (${res.status})`);
  }
  return `${BASE_URL}${data.path}`;
}

// Uploads a courier bill (image or PDF) to uploads/courier-bills and returns the stored relative path.
export async function uploadCourierBill(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", "courier-bills");
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/api/upload.php`, {
    method: "POST",
    body: form,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error) || `Upload failed (${res.status})`);
  }
  return data.path as string;
}

// Turns a stored relative upload path (e.g. /uploads/courier-bills/x.pdf) into a full URL.
export const fileUrl = (path: string) => (path.startsWith("http") ? path : `${BASE_URL}${path}`);

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

export type CaptchaChallenge = { token: string; image: string };
export type CaptchaAnswer = { captchaToken: string; captchaAnswer: string };

export const fetchCaptcha = () => apiGet<CaptchaChallenge>("/auth/captcha.php");

export const login = (email: string, password: string, captcha: CaptchaAnswer) =>
  apiPost<{ user: ApiUser; token: string; redirectTo: string }>("/auth/login.php", {
    email,
    password,
    ...captcha,
  });

export const forgotPassword = (email: string, captcha: CaptchaAnswer) =>
  apiPost<{ message: string }>("/auth/forgot_password.php", { email, ...captcha });

export const resetPassword = (token: string, password: string) =>
  apiPost<{ message: string }>("/auth/reset_password.php", { token, password });

export const logout = () => apiPost<{ loggedOut: boolean }>("/auth/logout.php", {});

export const register = (
  fullName: string,
  email: string,
  phone: string,
  password: string,
  captcha: CaptchaAnswer,
) =>
  apiPost<{ user: ApiUser; token: string; redirectTo: string }>("/auth/register.php", {
    fullName,
    email,
    phone,
    password,
    ...captcha,
  });
