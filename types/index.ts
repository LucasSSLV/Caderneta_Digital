// types/index.ts
export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  dataCadastro: string;
}

export interface Compra {
  id: string;
  clienteId: string;
  descricao: string;
  valor: number;
  data: string;
  pago: boolean;
}
