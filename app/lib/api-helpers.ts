export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined")
    return { "Content-Type": "application/json" };
  const token = localStorage.getItem("tk-token") || "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
