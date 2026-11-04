export const DTO = {
  account: (data: any) => {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      type: data.type,
      accountBalance: data.accountBalance,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
  accounts: (data: any[]) => {
    return data.map(DTO.account);
  },
};
