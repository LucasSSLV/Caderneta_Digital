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
      url = `whatsapp://send?phone=55${telefone}&text=${encodeURIComponent(
        mensagem
      )}`;
    } else {
      url = `whatsapp://send?text=${encodeURIComponent(mensagem)}`;
    }

    try {
      await Linking.openURL(url);
    } catch (openError) {
      const supported = await Linking.canOpenURL("whatsapp://send");

      if (!supported) {
        Alert.alert(
          "WhatsApp não encontrado",
          "Instale o WhatsApp para compartilhar extratos."
        );
      } else {
        await Linking.openURL(url);
      }
    }
  } catch (error) {
    console.error("Erro ao compartilhar via WhatsApp:", error);
    Alert.alert("Erro", "Não foi possível abrir o WhatsApp.");
  }
};
