import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-tk-tadika-2024";

export function verifyToken(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}
