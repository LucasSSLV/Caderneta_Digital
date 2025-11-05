// services/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cliente, Compra } from "../types";

const CLIENTES_KEY = "@caderneta:clientes";
const COMPRAS_KEY = "@caderneta:compras";

// ==================== CLIENTES ====================

export const salvarClientes = async (clientes: Cliente[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CLIENTES_KEY, JSON.stringify(clientes));
  } catch (error) {
    console.error("Erro ao salvar clientes:", error);
    throw error;
  }
};

export const carregarClientes = async (): Promise<Cliente[]> => {
  try {
    const data = await AsyncStorage.getItem(CLIENTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    return [];
  }
};

export const adicionarCliente = async (cliente: Cliente): Promise<void> => {
  try {
    const clientes = await carregarClientes();
    clientes.push(cliente);
    await salvarClientes(clientes);
  } catch (error) {
    console.error("Erro ao adicionar cliente:", error);
    throw error;
  }
};

export const atualizarCliente = async (
  clienteAtualizado: Cliente
): Promise<void> => {
  try {
    const clientes = await carregarClientes();
    const index = clientes.findIndex((c) => c.id === clienteAtualizado.id);

    if (index !== -1) {
      clientes[index] = clienteAtualizado;
      await salvarClientes(clientes);
    }
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    throw error;
  }
};

export const excluirCliente = async (clienteId: string): Promise<void> => {
  try {
    const clientes = await carregarClientes();
    const clientesFiltrados = clientes.filter((c) => c.id !== clienteId);
    await salvarClientes(clientesFiltrados);

    // Também excluir todas as compras deste cliente
    const compras = await carregarCompras();
    const comprasFiltradas = compras.filter((c) => c.clienteId !== clienteId);
    await salvarCompras(comprasFiltradas);
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    throw error;
  }
};

export const buscarClientePorId = async (
  clienteId: string
): Promise<Cliente | null> => {
  try {
    const clientes = await carregarClientes();
    return clientes.find((c) => c.id === clienteId) || null;
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    return null;
  }
};

// ==================== COMPRAS ====================

export const salvarCompras = async (compras: Compra[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(COMPRAS_KEY, JSON.stringify(compras));
  } catch (error) {
    console.error("Erro ao salvar compras:", error);
    throw error;
  }
};

export const carregarCompras = async (): Promise<Compra[]> => {
  try {
    const data = await AsyncStorage.getItem(COMPRAS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Erro ao carregar compras:", error);
    return [];
  }
};

export const adicionarCompra = async (compra: Compra): Promise<void> => {
  try {
    const compras = await carregarCompras();
    compras.push(compra);
    await salvarCompras(compras);
  } catch (error) {
    console.error("Erro ao adicionar compra:", error);
    throw error;
  }
};

export const atualizarCompra = async (
  compraAtualizada: Compra
): Promise<void> => {
  try {
    const compras = await carregarCompras();
    const index = compras.findIndex((c) => c.id === compraAtualizada.id);

    if (index !== -1) {
      compras[index] = compraAtualizada;
      await salvarCompras(compras);
    }
  } catch (error) {
    console.error("Erro ao atualizar compra:", error);
    throw error;
  }
};

export const excluirCompra = async (compraId: string): Promise<void> => {
  try {
    const compras = await carregarCompras();
    const comprasFiltradas = compras.filter((c) => c.id !== compraId);
    await salvarCompras(comprasFiltradas);
  } catch (error) {
    console.error("Erro ao excluir compra:", error);
    throw error;
  }
};

export const buscarComprasPorCliente = async (
  clienteId: string
): Promise<Compra[]> => {
  try {
    const compras = await carregarCompras();
    return compras.filter((c) => c.clienteId === clienteId);
  } catch (error) {
    console.error("Erro ao buscar compras do cliente:", error);
    return [];
  }
};

export const toggleCompraStatus = async (compraId: string): Promise<void> => {
  try {
    const compras = await carregarCompras();
    const compra = compras.find((c) => c.id === compraId);

    if (compra) {
      compra.pago = !compra.pago;
      await salvarCompras(compras);
    }
  } catch (error) {
    console.error("Erro ao alternar status da compra:", error);
    throw error;
  }
};

// ==================== UTILIDADES ====================

export const calcularTotalDevido = (compras: Compra[]): number => {
  return compras
    .filter((c) => !c.pago)
    .reduce((total, compra) => total + compra.valor, 0);
};

export const gerarId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ==================== DEBUG ====================

export const limparTodosDados = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([CLIENTES_KEY, COMPRAS_KEY]);
    console.log("Todos os dados foram limpos!");
  } catch (error) {
    console.error("Erro ao limpar dados:", error);
    throw error;
  }
};
