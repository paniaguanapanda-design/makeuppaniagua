import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

export type ConnectorReadiness = { ready: boolean };

export const getConnectorReadiness = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(
  async (): Promise<ConnectorReadiness> => {
    const { isConnectorTokenReady } = await import("./client.server.ts");
    return { ready: isConnectorTokenReady() };
  },
);
