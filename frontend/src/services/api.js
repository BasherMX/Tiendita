// Cliente y Helpers API centralizados

export const apiBase =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      ? `http://${window.location.hostname}:4000`
      : "";

export function getAuthToken() {
  return localStorage.getItem("token") || "";
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

export async function authFetch(url, options = {}, onAuthFail = null) {
  const token = getAuthToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      if (onAuthFail) {
        onAuthFail();
      }
      return null;
    }
    return response;
  } catch (err) {
    console.error("API Fetch error:", err);
    throw err;
  }
}
