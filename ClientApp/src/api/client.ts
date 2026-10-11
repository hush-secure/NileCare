import { API_BASE } from "../config";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (body && typeof body.message === "string") {
      return body.message;
    }
    if (body && typeof body.detail === "string") {
      return body.detail;
    }
    if (body && typeof body.title === "string") {
      return body.title;
    }
  } catch (error) {
  
  }
  return "Request failed (" + response.status + ").";
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(API_BASE + path, {
      ...options,
      headers: headers,
      credentials: "same-origin"
    });
  } catch (error) {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function get<T>(path: string) {
  return request<T>(path);
}

export function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export function del(path: string) {
  return request<void>(path, { method: "DELETE" });
}

export function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: "PUT", body: JSON.stringify(body) });
}
