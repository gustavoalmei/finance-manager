export {};

declare module "@fastify/secure-session" {
  interface SessionData {
    session: string;
  }
}
