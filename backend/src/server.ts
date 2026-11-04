import Fastify, { type FastifyInstance } from "fastify";
import routers from "@/app/routes/routes";
import cors from "@fastify/cors";
import fastifyMiddie from "@fastify/middie";
import fastifySecureSession from "@fastify/secure-session";
import auth from "@/app/plugins/auth";

const server: FastifyInstance = Fastify({
  logger: true,
});

const EXPIRATION_IN_MILLISECONDS = 2592000000;
const key = process.env.SECRET;
if (!key) {
  throw new Error(
    "SECRET environment variable must be set to a 64-character hex string (32 bytes)",
  );
}
await server
  .register(cors, {
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
  .register(fastifyMiddie)
  .register(fastifySecureSession, {
    sessionName: "session",
    cookieName: "session",
    key: Buffer.from(key, "hex"),
    expiry: EXPIRATION_IN_MILLISECONDS,
    cookie: {
      path: "/",
      httpOnly: true,
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
  .register(auth.middleware);

server.register(routers);

try {
  await server.listen({ port: 3000 });
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
