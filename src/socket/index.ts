import type { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET as string;

let ioInstance: Server | null = null;

export type CaseChangeAction =
  | "created"
  | "updated"
  | "deleted"
  | "moph_sent"
  | "moph_reset";

export type UserChangeAction = "created" | "updated" | "deleted";

function extractTokenFromSocket(socket: Socket): string | null {
  const authToken = socket.handshake.auth?.token;
  if (typeof authToken === "string" && authToken.trim()) {
    return authToken.replace(/^Bearer\s+/i, "").trim();
  }

  const authHeader = socket.handshake.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.trim()) {
    return authHeader.replace(/^Bearer\s+/i, "").trim();
  }

  const cookieHeader = socket.handshake.headers?.cookie;
  if (typeof cookieHeader === "string") {
    const match = cookieHeader.match(/(?:^|;\s*)(?:moph_token|token)=([^;]*)/);
    if (match) {
      return decodeURIComponent(match[1]).replace(/^Bearer\s+/i, "").trim();
    }
  }

  return null;
}

function resolveProviderIdFromSocket(socket: Socket): string | null {
  const explicitProviderId = socket.handshake.auth?.providerId;
  if (typeof explicitProviderId === "string" && explicitProviderId.trim() && explicitProviderId.trim() !== "unknown") {
    return explicitProviderId.trim();
  }

  const token = extractTokenFromSocket(socket);
  if (!token) return null;

  try {
    let decoded: any = null;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      decoded = jwt.decode(token);
    }

    if (!decoded || typeof decoded !== "object") return null;

    const rawId =
      decoded.provider_id ||
      decoded.providerId ||
      decoded.provider?.provider_id ||
      decoded.cid ||
      decoded.pid ||
      decoded.sub;

    if (rawId && String(rawId).trim() !== "" && String(rawId).trim() !== "unknown") {
      return String(rawId).trim();
    }
  } catch {
    return null;
  }

  return null;
}

export function initSocket(httpServer: HttpServer): Server {
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : true;

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    const providerId = resolveProviderIdFromSocket(socket);
    if (providerId) {
      socket.join(`user:${providerId}`);
    }

    socket.on("auth:join", (rawProviderId: unknown) => {
      if (typeof rawProviderId === "string" && rawProviderId.trim() && rawProviderId.trim() !== "unknown") {
        socket.join(`user:${rawProviderId.trim()}`);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): Server | null {
  return ioInstance;
}

export function emitCaseChanged(
  action: CaseChangeAction,
  payload: { id?: number; hn?: string; status?: number; actor?: string } = {},
): void {
  if (!ioInstance) return;
  ioInstance.emit("donor-cases:changed", {
    action,
    ...payload,
    timestamp: new Date().toISOString(),
  });
}

export function emitUserChanged(
  action: UserChangeAction,
  payload: {
    id?: number;
    provider_id?: string;
    app_role?: string;
    status?: string;
    is_active?: boolean;
    name?: string;
  } = {},
): void {
  if (!ioInstance) return;
  const eventData = {
    action,
    ...payload,
    timestamp: new Date().toISOString(),
  };

  ioInstance.emit("users:changed", eventData);

  if (payload.provider_id) {
    ioInstance.to(`user:${payload.provider_id}`).emit("user:role-updated", eventData);
  }
}
