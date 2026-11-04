import type { FastifyInstance } from "fastify";
import handlerMe, { meController } from "./controller";

type updateProfileType = {
  Body: {
    name: string;
    email: string;
    emailConfirmation: string;
    currentPassword?: string;
  };
};

type changePasswordType = {
  Body: {
    currentPassword: string;
    newPassword: string;
    confirmation: string;
  };
};

type updatePreferencesType = {
  Body: {
    monthStartDay: number;
  };
};

export default async function routes(fastify: FastifyInstance) {
  fastify.get("/me", { preHandler: fastify.authenticate }, handlerMe);
  fastify.put<updateProfileType>(
    "/me/profile",
    { preHandler: fastify.authenticate },
    meController.updateProfile,
  );
  fastify.put<changePasswordType>(
    "/me/password",
    { preHandler: fastify.authenticate },
    meController.changePassword,
  );
  fastify.post(
    "/me/sessions/revoke-others",
    { preHandler: fastify.authenticate },
    meController.revokeOtherSessions,
  );
  fastify.put<updatePreferencesType>(
    "/me/preferences",
    { preHandler: fastify.authenticate },
    meController.updatePreferences,
  );
}
