export const dto = {
  login: (data: any) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
    };
  },
  findByEmail: (data: any) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      password: data.password,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
  create: (data: any) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
  sessions: (data: any) => {
    return {
      id: data.id,
      token: data.token,
      expiresAt: data.expiresAt,
      userId: data.userId,
    };
  },
};
