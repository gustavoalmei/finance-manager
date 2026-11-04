import { DTO } from "./dto";
import { accountRepository } from "./repository";
import { HttpError } from "@/shared/erros/http-error";

type findAllTypes = {
  id: string;
  userId: string;
};

type deleteAccountType = {
  id: string;
  userId: string;
};

type updateAccountType = {
  id: string;
  data: {
    name: string;
    type: string;
    accountBalance: number;
  };
  userId: string;
};

type dataAccount = {
  userId: string;
  name: string;
  type: string;
  accountBalance: number;
};

type accountResponse = {
  id: any;
  userId: any;
  name: any;
  type: any;
  accountBalance: any;
  createdAt: any;
  updatedAt: any;
} | null;

interface accountService {
  findById: (data: findAllTypes) => Promise<accountResponse>;
  findAll: (data: findAllTypes) => Promise<accountResponse[]>;
  create: (data: dataAccount) => Promise<accountResponse>;
  delete: (data: deleteAccountType) => Promise<any>;
  update: (data: updateAccountType) => Promise<any>;
}

export const accountService: accountService = {
  findById: async (data: findAllTypes) => {
    try {
      let foundAccount = await accountRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!foundAccount) {
        throw new HttpError(404, "Usuário não possui conta.");
      }

      return DTO.account(foundAccount);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao encontrar conta.");
    }
  },
  findAll: async (data: findAllTypes) => {
    try {
      let foundAccounts = await accountRepository.findAllByUserId({
        id: data.id,
      });

      if (!foundAccounts) {
        throw new HttpError(404, "Usuário não possui contas.");
      }

      return DTO.accounts(foundAccounts);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao encontrar contas.");
    }
  },
  create: async (data: dataAccount) => {
    try {
      let dataAccount = {
        userId: data.userId,
        name: data.name,
        type: data.type,
        accountBalance: data.accountBalance,
      };

      let account = await accountRepository.create(dataAccount);
      if (!account) {
        throw new HttpError(500, "Erro ao criar conta.");
      }

      return DTO.account(account);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao criar conta.");
    }
  },
  delete: async (data: deleteAccountType) => {
    try {
      let account = await accountRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!account) {
        throw new HttpError(404, "Conta não encontrada.");
      }

      if (account.userId !== data.userId) {
        throw new HttpError(
          403,
          "Você não tem permissão para excluir esta conta.",
        );
      }

      let deleteAccount = await accountRepository.delete({
        id: data.id,
        userId: data.userId,
      });
      if (!deleteAccount) {
        throw new HttpError(500, "Erro ao deletar conta.");
      }

      return DTO.account(deleteAccount);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao deletar conta.");
    }
  },
  update: async (data: updateAccountType) => {
    try {
      let account = await accountRepository.findById({
        id: data.id,
        userId: data.userId,
      });

      if (!account) {
        throw new HttpError(404, "Conta não encontrada.");
      }

      if (account.userId !== data.userId) {
        throw new HttpError(
          403,
          "Você não tem permissão para alterar esta conta.",
        );
      }

      let updateAccount = await accountRepository.update({
        id: data.id,
        userId: data.userId,
        data: data.data,
      });
      if (!updateAccount) {
        throw new HttpError(500, "Erro ao atualizar conta.");
      }

      return DTO.account(updateAccount);
    } catch (error: any) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Erro ao atualizar conta.");
    }
  },
};
