export const DTO = {
  category: (data: any) => {
    return {
      id: data.id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  },
  categories: (data: any[]) => {
    return data.map(DTO.category);
  },
};
