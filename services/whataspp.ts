// services/whatsapp.ts
import { Alert, Linking } from "react-native";
import { Cliente, Compra } from "../types";

const formatarValor = (valor: number): string => {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString("pt-BR");
};

export const compartilharExtratoCliente = async (
  cliente: Cliente,
  compras: Compra[],
  totalDevido: number
) => {
  try {
    const comprasPendentes = compras.filter((c) => !c.pago);
    const comprasPagas = compras.filter((c) => c.pago);

    let mensagem = `📓 *EXTRATO - ${cliente.nome.toUpperCase()}*\n\n`;

    // Compras Pendentes
    if (comprasPendentes.length > 0) {
      mensagem += `⏳ *PENDENTES*\n`;
      comprasPendentes.forEach((compra) => {
        mensagem += `• ${formatarData(compra.data)}: ${formatarValor(
          compra.valorTotal
        )}\n`;
        if (compra.observacao) {
          mensagem += `  _${compra.observacao}_\n`;
        }
      });
      mensagem += `\n`;
    }

    // Compras Pagas
    if (comprasPagas.length > 0) {
      mensagem += `✅ *PAGAS*\n`;
      comprasPagas.slice(0, 5).forEach((compra) => {
        mensagem += `• ${formatarData(compra.data)}: ${formatarValor(
          compra.valorTotal
        )}\n`;
      });
      if (comprasPagas.length > 5) {
        mensagem += `_...e mais ${comprasPagas.length - 5} compras pagas_\n`;
      }
      mensagem += `\n`;
    }

    // Total
    mensagem += `━━━━━━━━━━━━━━━━\n`;
    mensagem += `💰 *TOTAL A PAGAR*: ${formatarValor(totalDevido)}\n\n`;

    if (totalDevido === 0) {
      mensagem += `🎉 Parabéns! Sua conta está em dia!\n\n`;
    }

    mensagem += `_Enviado via Caderneta Digital_`;

    // Tentar abrir WhatsApp
    const telefone = cliente.telefone?.replace(/\D/g, "");
    let url = "";

    if (telefone && telefone.length >= 10) {
      // Com telefone específico
      url = `whatsapp://send?phone=55${telefone}&text=${encodeURIComponent(
        mensagem
      )}`;
    } else {
      // Sem telefone - abre WhatsApp com mensagem pronta
      url = `whatsapp://send?text=${encodeURIComponent(mensagem)}`;
    }

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "WhatsApp não encontrado",
        "Instale o WhatsApp para compartilhar extratos."
      );
    }
  } catch (error) {
    console.error("Erro ao compartilhar via WhatsApp:", error);
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
  }
};

export const compartilharCobranca = async (
  cliente: Cliente,
  totalDevido: number
) => {
  try {
    let mensagem = `🔔 *LEMBRETE DE PAGAMENTO*\n\n`;
    mensagem += `Olá, ${cliente.nome}! 👋\n\n`;
    mensagem += `Você tem um valor pendente:\n`;
    mensagem += `💰 ${formatarValor(totalDevido)}\n\n`;
    mensagem += `Por favor, quando puder, regularize seu pagamento. 😊\n\n`;
    mensagem += `_Enviado via Caderneta Digital_`;

    const telefone = cliente.telefone?.replace(/\D/g, "");
    let url = "";

    if (telefone && telefone.length >= 10) {
      url = `whatsapp://send?phone=55${telefone}&text=${encodeURIComponent(
        mensagem
      )}`;
    } else {
      url = `whatsapp://send?text=${encodeURIComponent(mensagem)}`;
    }

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "WhatsApp não encontrado",
        "Instale o WhatsApp para enviar cobranças."
      );
    }
  } catch (error) {
    console.error("Erro ao enviar cobrança:", error);
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
  }
};

export const compartilharRelatorioGeral = async (
  totalDevedores: number,
  totalDevido: number,
  totalRecebido: number
) => {
  try {
    let mensagem = `📊 *RELATÓRIO GERAL*\n\n`;
    mensagem += `📅 ${new Date().toLocaleDateString("pt-BR")}\n\n`;
    mensagem += `👥 Clientes devedores: ${totalDevedores}\n`;
    mensagem += `💰 Total a receber: ${formatarValor(totalDevido)}\n`;
    mensagem += `✅ Total recebido: ${formatarValor(totalRecebido)}\n\n`;
    mensagem += `_Enviado via Caderneta Digital_`;

    const url = `whatsapp://send?text=${encodeURIComponent(mensagem)}`;

    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "WhatsApp não encontrado",
        "Instale o WhatsApp para compartilhar relatórios."
      );
    }
  } catch (error) {
    console.error("Erro ao compartilhar relatório:", error);
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
  }
};
