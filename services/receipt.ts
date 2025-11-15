// services/receipt.ts - Serviço de Recibos/Notas
import { Alert, Share } from "react-native";
import { Cliente, Compra } from "../types";

export interface DadosEmpresa {
  nome: string;
  cnpj?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
}

const EMPRESA_KEY = "@caderneta:dados_empresa";

// Configuração padrão da empresa
let dadosEmpresa: DadosEmpresa = {
  nome: "Minha Empresa",
  telefone: "",
  endereco: "",
  cidade: "",
};

export const salvarDadosEmpresa = async (
  dados: DadosEmpresa
): Promise<void> => {
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    await AsyncStorage.setItem(EMPRESA_KEY, JSON.stringify(dados));
    dadosEmpresa = dados;
  } catch (error) {
    console.error("Erro ao salvar dados da empresa:", error);
    throw error;
  }
};

export const carregarDadosEmpresa = async (): Promise<DadosEmpresa> => {
  try {
    const AsyncStorage =
      require("@react-native-async-storage/async-storage").default;
    const data = await AsyncStorage.getItem(EMPRESA_KEY);
    if (data) {
      dadosEmpresa = JSON.parse(data);
    }
    return dadosEmpresa;
  } catch (error) {
    console.error("Erro ao carregar dados da empresa:", error);
    return dadosEmpresa;
  }
};

const formatarValor = (valor: number): string => {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatarData = (data: string): string => {
  return new Date(data).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatarDataSimples = (data: string): string => {
  return new Date(data).toLocaleDateString("pt-BR");
};

// Gerar texto do recibo (para compartilhar)
export const gerarTextoRecibo = (
  cliente: Cliente,
  compra: Compra,
  numero: string
): string => {
  let texto = "";

  // Cabeçalho
  texto += "═══════════════════════════════\n";
  texto += `   ${dadosEmpresa.nome.toUpperCase()}\n`;
  texto += "═══════════════════════════════\n\n";

  if (dadosEmpresa.cnpj) {
    texto += `CNPJ: ${dadosEmpresa.cnpj}\n`;
  }
  if (dadosEmpresa.telefone) {
    texto += `Tel: ${dadosEmpresa.telefone}\n`;
  }
  if (dadosEmpresa.endereco) {
    texto += `${dadosEmpresa.endereco}\n`;
  }
  if (dadosEmpresa.cidade) {
    texto += `${dadosEmpresa.cidade}\n`;
  }

  texto += "\n───────────────────────────────\n";
  texto += "         RECIBO DE VENDA\n";
  texto += "───────────────────────────────\n\n";

  // Número e Data
  texto += `Nº: ${numero}\n`;
  texto += `Data: ${formatarData(compra.data)}\n\n`;

  // Cliente
  texto += `Cliente: ${cliente.nome}\n`;
  if (cliente.telefone) {
    texto += `Tel: ${cliente.telefone}\n`;
  }

  texto += "\n───────────────────────────────\n";
  texto += "           ITENS\n";
  texto += "───────────────────────────────\n\n";

  // Itens
  if (compra.itens && compra.itens.length > 0) {
    compra.itens.forEach((item) => {
      const tipo = item.tipo === "unidade" ? "un" : "cx";
      texto += `${item.nomeProduto}\n`;
      texto += `  ${item.quantidade} ${tipo} × ${formatarValor(
        item.precoUnitario
      )}\n`;
      texto += `  Subtotal: ${formatarValor(item.subtotal)}\n\n`;
    });
  }

  texto += "───────────────────────────────\n\n";

  // Total
  texto += `TOTAL: ${formatarValor(compra.valorTotal)}\n\n`;

  // Status
  if (compra.pago) {
    texto += "✓ PAGO\n";
  } else {
    texto += "⏳ PENDENTE\n";
  }

  // Observação
  if (compra.observacao) {
    texto += `\nObs: ${compra.observacao}\n`;
  }

  texto += "\n───────────────────────────────\n";
  texto += "    Obrigado pela preferência!\n";
  texto += "═══════════════════════════════\n";

  return texto;
};

// Gerar HTML do recibo (para PDF/impressão)
export const gerarHTMLRecibo = (
  cliente: Cliente,
  compra: Compra,
  numero: string
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo #${numero}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      padding: 20px;
      max-width: 400px;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .header h1 {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .header p {
      font-size: 12px;
      line-height: 1.4;
    }
    
    .title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 15px 0;
      padding: 10px 0;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
    }
    
    .info {
      margin-bottom: 15px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
      font-size: 13px;
    }
    
    .section {
      margin: 15px 0;
      padding: 10px 0;
      border-top: 1px dashed #000;
    }
    
    .section-title {
      font-weight: bold;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .item {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px dotted #ccc;
    }
    
    .item-name {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 3px;
    }
    
    .item-details {
      font-size: 12px;
      color: #333;
      margin-left: 10px;
    }
    
    .total {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 2px solid #000;
      text-align: right;
    }
    
    .total-label {
      font-size: 16px;
      font-weight: bold;
    }
    
    .total-value {
      font-size: 20px;
      font-weight: bold;
      margin-top: 5px;
    }
    
    .status {
      text-align: center;
      margin: 15px 0;
      padding: 10px;
      font-weight: bold;
      font-size: 14px;
    }
    
    .status.paid {
      background: #E8F5E9;
      color: #27ae60;
    }
    
    .status.pending {
      background: #FFF3E0;
      color: #f39c12;
    }
    
    .observation {
      margin: 15px 0;
      padding: 10px;
      background: #f5f5f5;
      border-left: 3px solid #007AFF;
      font-size: 12px;
    }
    
    .footer {
      text-align: center;
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid #000;
      font-size: 12px;
    }
    
    @media print {
      body {
        padding: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${dadosEmpresa.nome.toUpperCase()}</h1>
    ${dadosEmpresa.cnpj ? `<p>CNPJ: ${dadosEmpresa.cnpj}</p>` : ""}
    ${dadosEmpresa.telefone ? `<p>Tel: ${dadosEmpresa.telefone}</p>` : ""}
    ${dadosEmpresa.endereco ? `<p>${dadosEmpresa.endereco}</p>` : ""}
    ${dadosEmpresa.cidade ? `<p>${dadosEmpresa.cidade}</p>` : ""}
  </div>
  
  <div class="title">RECIBO DE VENDA</div>
  
  <div class="info">
    <div class="info-row">
      <span>Nº:</span>
      <span><strong>${numero}</strong></span>
    </div>
    <div class="info-row">
      <span>Data:</span>
      <span>${formatarData(compra.data)}</span>
    </div>
    <div class="info-row">
      <span>Cliente:</span>
      <span><strong>${cliente.nome}</strong></span>
    </div>
    ${
      cliente.telefone
        ? `
    <div class="info-row">
      <span>Tel:</span>
      <span>${cliente.telefone}</span>
    </div>
    `
        : ""
    }
  </div>
  
  <div class="section">
    <div class="section-title">ITENS</div>
    ${
      compra.itens && compra.itens.length > 0
        ? compra.itens
            .map(
              (item) => `
      <div class="item">
        <div class="item-name">${item.nomeProduto}</div>
        <div class="item-details">
          ${item.quantidade} ${
                item.tipo === "unidade" ? "un" : "cx"
              } × ${formatarValor(item.precoUnitario)}
        </div>
        <div class="item-details">
          <strong>Subtotal: ${formatarValor(item.subtotal)}</strong>
        </div>
      </div>
    `
            )
            .join("")
        : '<p style="text-align: center; color: #999;">Nenhum item</p>'
    }
  </div>
  
  <div class="total">
    <div class="total-label">TOTAL</div>
    <div class="total-value">${formatarValor(compra.valorTotal)}</div>
  </div>
  
  <div class="status ${compra.pago ? "paid" : "pending"}">
    ${compra.pago ? "✓ PAGO" : "⏳ PENDENTE"}
  </div>
  
  ${
    compra.observacao
      ? `
  <div class="observation">
    <strong>Observação:</strong><br>
    ${compra.observacao}
  </div>
  `
      : ""
  }
  
  <div class="footer">
    <p>Obrigado pela preferência!</p>
    <p style="margin-top: 5px; font-size: 10px;">
      Emitido em ${formatarDataSimples(new Date().toISOString())}
    </p>
  </div>
</body>
</html>
  `;
};

// Compartilhar recibo por texto
export const compartilharReciboTexto = async (
  cliente: Cliente,
  compra: Compra,
  numero: string
): Promise<void> => {
  try {
    await carregarDadosEmpresa();
    const texto = gerarTextoRecibo(cliente, compra, numero);

    await Share.share({
      message: texto,
      title: `Recibo #${numero} - ${cliente.nome}`,
    });
  } catch (error) {
    console.error("Erro ao compartilhar recibo:", error);
    Alert.alert("Erro", "Não foi possível compartilhar o recibo.");
  }
};

// Gerar número de recibo único
export const gerarNumeroRecibo = (compraId: string): string => {
  const data = new Date();
  const ano = data.getFullYear().toString().slice(-2);
  const mes = (data.getMonth() + 1).toString().padStart(2, "0");
  const dia = data.getDate().toString().padStart(2, "0");
  const sufixo = compraId.slice(-4).toUpperCase();

  return `${ano}${mes}${dia}-${sufixo}`;
};

// Enviar recibo via WhatsApp
export const enviarReciboWhatsApp = async (
  cliente: Cliente,
  compra: Compra,
  numero: string
): Promise<void> => {
  try {
    await carregarDadosEmpresa();
    const texto = gerarTextoRecibo(cliente, compra, numero);

    const telefone = cliente.telefone?.replace(/\D/g, "");
    const { Linking } = require("react-native");

    // Montar URL do WhatsApp
    const url =
      telefone && telefone.length >= 10
        ? `whatsapp://send?phone=55${telefone}&text=${encodeURIComponent(
            texto
          )}`
        : `whatsapp://send?text=${encodeURIComponent(texto)}`;

    // Tenta abrir diretamente sem verificar canOpenURL
    try {
      await Linking.openURL(url);
    } catch (openError) {
      // Se falhar ao abrir, tenta verificar se o WhatsApp está instalado
      const supported = await Linking.canOpenURL("whatsapp://send");

      if (!supported) {
        Alert.alert(
          "WhatsApp não encontrado",
          "Instale o WhatsApp para enviar recibos.",
          [{ text: "OK" }]
        );
      } else {
        // Se o WhatsApp existe mas falhou, tenta novamente
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    console.error("Erro ao enviar recibo via WhatsApp:", error);
    Alert.alert(
      "Erro",
      "Não foi possível enviar o recibo. Verifique se o WhatsApp está instalado."
    );
  }
};
