// types/index.ts
export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  dataCadastro: string;
}

export interface Produto {
  id: string;
  nome: string;
  categoria?: string;
  precoUnidade: number;
  precoCaixa?: number;
  pesoUnidade?: number;
  unidadesPorCaixa?: number;
  estoque?: number;
  estoqueMinimo?: number; // Novo: define quando alertar (padrão: 5)
  dataCadastro: string;
}

export interface ItemCompra {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  tipo: 'unidade' | 'caixa';
  precoUnitario: number;
  subtotal: number;
}

export interface Compra {
  id: string;
  clienteId: string;
  itens: ItemCompra[];
  valorTotal: number;
  data: string;
  pago: boolean;
  observacao?: string;
}