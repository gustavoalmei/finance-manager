import { prisma } from "@/app/plugins/database";
import { dto } from "./dto";

// Requests
type createUserType = {
  name: string;
  email: string;
  password: string;
};

type findByEmailType = {
  email: string;
};

type createSessionType = {
  token: string;
  expiresAt: Date;
  userId: string;
};

type findValidSessionType = {
  token: string;
};

type deleteSessionType = {
  token: string;
};

type findByIdType = {
  id: string;
};

// Responses
type responseFindByEmail = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
} | null;

type responseCreate = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

type responsefindValidSession = {
  id: string;
  token: string;
  expiresAt: Date;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    monthStartDay: number;
    createdAt: Date;
    updatedAt: Date;
  };
} | null;

type responseFindByIdType = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
} | null;

interface userRepositoryInterface {
  create: (data: createUserType) => Promise<responseCreate>;
  findByEmail: (data: findByEmailType) => Promise<responseFindByEmail>;
  createSession: (data: createSessionType) => Promise<any>;
  findValidSession: (
    data: findValidSessionType,
  ) => Promise<responsefindValidSession>;
  deleteSession: (data: deleteSessionType) => Promise<any>;
  findById: (data: findByIdType) => Promise<responseFindByIdType>;
}

export const authRepository: userRepositoryInterface = {
  create: async (data: createUserType) => {
    return await prisma.user.create({
      data,
    });
  },
  findByEmail: async (data: findByEmailType) => {
    return await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });
  },
  createSession: async (data: createSessionType) => {
    return await prisma.sessions.create({
      data,
    });
  },
  findValidSession: async (data: findValidSessionType) => {
    const session = await prisma.sessions.findFirst({
      where: { token: data.token },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  },
  deleteSession: async (data: deleteSessionType) => {
    await prisma.sessions.deleteMany({ where: { token: data.token } });
  },
  findById: async (data: findByIdType) => {
    return await prisma.user.findUnique({
      where: { id: data.id },
    });
  },
};
