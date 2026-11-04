import { prisma } from "@/app/plugins/database";

type updateUserType = {
  id: string;
  data: {
    name?: string;
    email?: string;
    monthStartDay?: number;
  };
};

type changePasswordType = {
  id: string;
  password: string;
  // sessão de quem trocou a senha: continua logada
  keepToken: string;
};

type deleteOtherSessionsType = {
  userId: string;
  keepToken: string;
};

interface meRepositoryInterface {
  updateUser: (data: updateUserType) => Promise<any>;
  changePassword: (data: changePasswordType) => Promise<number>;
  deleteOtherSessions: (data: deleteOtherSessionsType) => Promise<number>;
}

export const meRepository: meRepositoryInterface = {
  updateUser: async ({ id, data }: updateUserType) => {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },
  // Troca a senha e derruba as outras sessões juntas: se a senha vazou,
  // quem estava logado com ela perde o acesso na hora
  changePassword: async ({ id, password, keepToken }: changePasswordType) => {
    const [, deleted] = await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { password } }),
      prisma.sessions.deleteMany({
        where: { userId: id, token: { not: keepToken } },
      }),
    ]);
    return deleted.count;
  },
  deleteOtherSessions: async ({ userId, keepToken }: deleteOtherSessionsType) => {
    const deleted = await prisma.sessions.deleteMany({
      where: { userId, token: { not: keepToken } },
    });
    return deleted.count;
  },
};
