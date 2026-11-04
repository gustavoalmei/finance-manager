import type { FastifyReply, FastifyRequest } from "fastify";
import { handleError } from "@/shared/erros/handle-error";
import { HttpError } from "@/shared/erros/http-error";
import { dto } from "./dto";
import { meBodySchema } from "./schema";
import { meService } from "./service";

type userType = {
  id: string;
  name: string;
  email: string;
};

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

async function handlerMe(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(200).send(dto.me(request.user));
}

// usuário + token da sessão atual (a que não é derrubada)
const sessionOf = (request: FastifyRequest) => {
  const user = request.user as userType;
  const token = request.session.get("session");
  if (!user || !token) {
    throw new HttpError(401, "Não autenticado.");
  }
  return { user, token };
};

const parseOrThrow = <T>(
  result: { success: true; data: T } | { success: false; error: any },
) => {
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ?? "Dados inválidos.",
    );
  }
  return result.data;
};

export const meController = {
  updateProfile: async (
    request: FastifyRequest<updateProfileType>,
    reply: FastifyReply,
  ) => {
    try {
      const { user } = sessionOf(request);
      const body = parseOrThrow(meBodySchema.profile.safeParse(request.body));

      const updated = await meService.updateProfile({
        userId: user.id,
        name: body.name,
        email: body.email,
        currentPassword: body.currentPassword,
      });

      return reply.code(200).send(updated);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  changePassword: async (
    request: FastifyRequest<changePasswordType>,
    reply: FastifyReply,
  ) => {
    try {
      const { user, token } = sessionOf(request);
      const body = parseOrThrow(meBodySchema.password.safeParse(request.body));

      const result = await meService.changePassword({
        userId: user.id,
        token,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });

      return reply.code(200).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  revokeOtherSessions: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { user, token } = sessionOf(request);

      const result = await meService.revokeOtherSessions({
        userId: user.id,
        token,
      });

      return reply.code(200).send(result);
    } catch (error) {
      return handleError(reply, error);
    }
  },
  updatePreferences: async (
    request: FastifyRequest<updatePreferencesType>,
    reply: FastifyReply,
  ) => {
    try {
      const { user } = sessionOf(request);
      const body = parseOrThrow(
        meBodySchema.preferences.safeParse(request.body),
      );

      const updated = await meService.updatePreferences({
        userId: user.id,
        monthStartDay: body.monthStartDay,
      });

      return reply.code(200).send(updated);
    } catch (error) {
      return handleError(reply, error);
    }
  },
};

export default handlerMe;
