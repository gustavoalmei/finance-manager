import auth from "@/app/plugins/auth";
import { HttpError } from "@/shared/erros/http-error";
import { authRepository } from "../auth/repository";
import { dto } from "./dto";
import { meRepository } from "./repository";

type updateProfileType = {
  userId: string;
  name: string;
  email: string;
  currentPassword?: string | undefined;
};

type changePasswordType = {
  userId: string;
  token: string;
  currentPassword: string;
  newPassword: string;
};

type revokeOtherSessionsType = {
  userId: string;
  token: string;
};

type updatePreferencesType = {
  userId: string;
  monthStartDay: number;
};

interface meServiceInterface {
  updateProfile: (data: updateProfileType) => Promise<any>;
  changePassword: (data: changePasswordType) => Promise<any>;
  revokeOtherSessions: (data: revokeOtherSessionsType) => Promise<any>;
  updatePreferences: (data: updatePreferencesType) => Promise<any>;
}

const findUser = async (userId: string) => {
  const user = await authRepository.findById({ id: userId });
  if (!user) {
    throw new HttpError(404, "Usuário não encontrado.");
  }
  return user;
};

// senha errada e senha ausente dão a mesma resposta
const assertPassword = async (password: string | undefined, hash: string) => {
  if (!password || !(await auth.verifyHash(password, hash))) {
    throw new HttpError(400, "Senha atual incorreta.");
  }
};

export const meService: meServiceInterface = {
  updateProfile: async (data: updateProfileType) => {
    try {
      const user = await findUser(data.userId);
      const emailChanged = data.email !== user.email;

      if (emailChanged) {
        // a senha vem antes da checagem de e-mail em uso: sem ela, a rota
        // diria a qualquer um quais e-mails têm conta
        await assertPassword(data.currentPassword, user.password);

        const owner = await authRepository.findByEmail({ email: data.email });
        if (owner && owner.id !== user.id) {
          throw new HttpError(409, "Este e-mail já está em uso.");
        }
      }

      const updated = await meRepository.updateUser({
        id: user.id,
        data: {
          name: data.name,
          ...(emailChanged && { email: data.email }),
        },
      });

      return dto.me(updated);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao atualizar o perfil.");
    }
  },
  changePassword: async (data: changePasswordType) => {
    try {
      const user = await findUser(data.userId);
      await assertPassword(data.currentPassword, user.password);

      const revokedSessions = await meRepository.changePassword({
        id: user.id,
        password: await auth.createHash(data.newPassword),
        keepToken: data.token,
      });

      return { message: "Senha alterada com sucesso.", revokedSessions };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao alterar a senha.");
    }
  },
  revokeOtherSessions: async (data: revokeOtherSessionsType) => {
    try {
      const revokedSessions = await meRepository.deleteOtherSessions({
        userId: data.userId,
        keepToken: data.token,
      });

      return { message: "Outras sessões encerradas.", revokedSessions };
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao encerrar as sessões.");
    }
  },
  updatePreferences: async (data: updatePreferencesType) => {
    try {
      const updated = await meRepository.updateUser({
        id: data.userId,
        data: { monthStartDay: data.monthStartDay },
      });

      return dto.me(updated);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao salvar as preferências.");
    }
  },
};
