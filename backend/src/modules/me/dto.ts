export const dto = {
  me: (data: any) => {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      monthStartDay: data.monthStartDay,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
};
