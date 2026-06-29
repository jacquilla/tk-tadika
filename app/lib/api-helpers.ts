export const getAuthHeaders = () => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("tk-token") || "" : "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};
