// services/bluetoothPrinter.ts
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { Cliente, Compra } from "../types";
import { carregarDadosEmpresa } from "./receipt";

// SOLUÇÃO ALTERNATIVA: Usar expo-print + expo-sharing
// npm install expo-print expo-sharing
let Print: any;
let Sharing: any;

try {
  Print = require("expo-print");
  Sharing = require("expo-sharing");
} catch (error) {
  console.log("Expo Print não instalado - usando fallback");
}

// Biblioteca Bluetooth (opcional - só se instalada)
let BluetoothManager: any;
let BluetoothEscposPrinter: any;

try {
  const printer = require("react-native-bluetooth-escpos-printer");
  BluetoothManager = printer.BluetoothManager;
  BluetoothEscposPrinter = printer.BluetoothEscposPrinter;
  console.log("✅ Biblioteca Bluetooth ESC/POS carregada");
} catch (error) {
  console.log("ℹ️ Biblioteca Bluetooth não instalada - usando modo PDF");
}

export interface PrinterDevice {
  address: string;
  name: string;
}

// Verificar se tem suporte Bluetooth nativo
export const temSuporteBluetooth = (): boolean => {
  return BluetoothManager !== undefined;
};

// Verificar se tem suporte a PDF
export const temSuportePDF = (): boolean => {
  return Print !== undefined;
};

// Solicitar permissões Bluetooth
export const solicitarPermissoesBluetooth = async (): Promise<boolean> => {
  if (Platform.OS === "android") {
    try {
      if (Platform.Version >= 31) {
        // Android 12+
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted["android.permission.BLUETOOTH_SCAN"] === "granted" &&
          granted["android.permission.BLUETOOTH_CONNECT"] === "granted" &&
          granted["android.permission.ACCESS_FINE_LOCATION"] === "granted"
        );
      } else {
        // Android 11 ou inferior - usar apenas localização
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        return granted === "granted";
      }
    } catch (error) {
      console.error("Erro ao solicitar permissões:", error);
      return false;
    }
  }
  return true; // iOS não precisa de permissões explícitas
};

// Verificar se o Bluetooth está habilitado
export const verificarBluetoothHabilitado = async (): Promise<boolean> => {
  try {
    if (!BluetoothManager) return false;
    const enabled = await BluetoothManager.isBluetoothEnabled();
    return enabled;
  } catch (error) {
    console.error("Erro ao verificar Bluetooth:", error);
    return false;
  }
};

// Habilitar Bluetooth
export const habilitarBluetooth = async (): Promise<boolean> => {
  try {
    if (!BluetoothManager) return false;
    await BluetoothManager.enableBluetooth();
    return true;
  } catch (error) {
    console.error("Erro ao habilitar Bluetooth:", error);
    return false;
  }
};

// Buscar impressoras disponíveis
export const buscarImpressoras = async (): Promise<PrinterDevice[]> => {
  try {
    if (!BluetoothManager) {
      Alert.alert(
        "Bluetooth não disponível",
        'Para usar impressoras Bluetooth, é necessário fazer uma build nativa do app.\n\nEnquanto isso, você pode usar a opção "Gerar PDF" para compartilhar recibos.',
        [{ text: "OK" }]
      );
      return [];
    }

    const permissao = await solicitarPermissoesBluetooth();
    if (!permissao) {
      Alert.alert(
        "Permissão Negada",
        "É necessário permitir o acesso ao Bluetooth para buscar impressoras."
      );
      return [];
    }

    const enabled = await verificarBluetoothHabilitado();
    if (!enabled) {
      Alert.alert(
        "Bluetooth Desabilitado",
        "Habilite o Bluetooth para buscar impressoras.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Habilitar",
            onPress: async () => {
              await habilitarBluetooth();
            },
          },
        ]
      );
      return [];
    }

    // Buscar dispositivos pareados
    const pairedDevices = await BluetoothManager.enableBluetooth();

    // Filtrar apenas impressoras (geralmente começam com "RPP", "MTP", "Printer", etc)
    const impressoras = pairedDevices.filter((device: any) => {
      const name = device.name?.toUpperCase() || "";
      return (
        name.includes("PRINTER") ||
        name.includes("RPP") ||
        name.includes("MTP") ||
        name.includes("POS") ||
        name.includes("RECEIPT") ||
        name.includes("THERMAL")
      );
    });

    return impressoras.map((device: any) => ({
      address: device.address,
      name: device.name || "Impressora",
    }));
  } catch (error) {
    console.error("Erro ao buscar impressoras:", error);
    Alert.alert("Erro", "Não foi possível buscar impressoras disponíveis.");
    return [];
  }
};

// Conectar a uma impressora
export const conectarImpressora = async (address: string): Promise<boolean> => {
  try {
    if (!BluetoothManager) return false;
    await BluetoothManager.connect(address);
    return true;
  } catch (error) {
    console.error("Erro ao conectar impressora:", error);
    Alert.alert("Erro", "Não foi possível conectar à impressora.");
    return false;
  }
};

// Desconectar impressora
export const desconectarImpressora = async (): Promise<void> => {
  try {
    if (!BluetoothManager) return;
    await BluetoothManager.disconnect();
  } catch (error) {
    console.error("Erro ao desconectar impressora:", error);
  }
};

// Formatar dados para impressão
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

// ALTERNATIVA: Gerar e compartilhar PDF (funciona sem biblioteca nativa)
export const gerarPDFRecibo = async (
  cliente: Cliente,
  compra: Compra,
  numeroRecibo: string
): Promise<void> => {
  try {
    if (!Print || !Sharing) {
      Alert.alert(
        "Recursos não disponíveis",
        "Instale expo-print e expo-sharing para gerar PDFs."
      );
      return;
    }

    const empresa = await carregarDadosEmpresa();

    // Importar HTML do recibo
    const { gerarHTMLRecibo } = require("./receipt");
    const html = gerarHTMLRecibo(cliente, compra, numeroRecibo);

    // Gerar PDF
    const { uri } = await Print.printToFileAsync({ html });

    // Compartilhar
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Recibo #${numeroRecibo} - ${cliente.nome}`,
        UTI: "com.adobe.pdf",
      });
    } else {
      Alert.alert(
        "Erro",
        "Não é possível compartilhar arquivos neste dispositivo."
      );
    }
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    Alert.alert("Erro", "Não foi possível gerar o PDF do recibo.");
  }
};

// Imprimir recibo (com fallback para PDF)
export const imprimirRecibo = async (
  cliente: Cliente,
  compra: Compra,
  numeroRecibo: string,
  printerAddress?: string
): Promise<boolean> => {
  try {
    // Se não tem biblioteca Bluetooth, usar PDF
    if (!BluetoothEscposPrinter) {
      Alert.alert(
        "Impressão Bluetooth não disponível",
        "Deseja gerar um PDF do recibo para compartilhar?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Gerar PDF",
            onPress: () => gerarPDFRecibo(cliente, compra, numeroRecibo),
          },
        ]
      );
      return false;
    }

    // Continua com impressão Bluetooth normal...
    if (printerAddress) {
      const conectado = await conectarImpressora(printerAddress);
      if (!conectado) return false;
    }

    const empresa = await carregarDadosEmpresa();

    // Iniciar impressão
    await BluetoothEscposPrinter.printerInit();

    // Cabeçalho da empresa
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText(`${empresa.nome.toUpperCase()}\n`, {
      fonttype: 1,
      widthtimes: 1,
      heigthtimes: 1,
    });

    if (empresa.cnpj) {
      await BluetoothEscposPrinter.printText(`CNPJ: ${empresa.cnpj}\n`, {});
    }
    if (empresa.telefone) {
      await BluetoothEscposPrinter.printText(`Tel: ${empresa.telefone}\n`, {});
    }
    if (empresa.endereco) {
      await BluetoothEscposPrinter.printText(`${empresa.endereco}\n`, {});
    }
    if (empresa.cidade) {
      await BluetoothEscposPrinter.printText(`${empresa.cidade}\n`, {});
    }

    await BluetoothEscposPrinter.printText(
      "================================\n",
      {}
    );

    // Título
    await BluetoothEscposPrinter.printText("RECIBO DE VENDA\n", {
      fonttype: 1,
    });
    await BluetoothEscposPrinter.printText(
      "================================\n",
      {}
    );

    // Informações
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT
    );
    await BluetoothEscposPrinter.printText(`No: ${numeroRecibo}\n`, {});
    await BluetoothEscposPrinter.printText(
      `Data: ${formatarData(compra.data)}\n`,
      {}
    );
    await BluetoothEscposPrinter.printText(`Cliente: ${cliente.nome}\n`, {});

    if (cliente.telefone) {
      await BluetoothEscposPrinter.printText(`Tel: ${cliente.telefone}\n`, {});
    }

    await BluetoothEscposPrinter.printText(
      "--------------------------------\n",
      {}
    );
    await BluetoothEscposPrinter.printText("ITENS\n", { fonttype: 1 });
    await BluetoothEscposPrinter.printText(
      "--------------------------------\n",
      {}
    );

    // Itens
    if (compra.itens && compra.itens.length > 0) {
      for (const item of compra.itens) {
        const tipo = item.tipo === "unidade" ? "un" : "cx";

        await BluetoothEscposPrinter.printText(`${item.nomeProduto}\n`, {});
        await BluetoothEscposPrinter.printText(
          `  ${item.quantidade} ${tipo} x ${formatarValor(
            item.precoUnitario
          )}\n`,
          {}
        );
        await BluetoothEscposPrinter.printText(
          `  Subtotal: ${formatarValor(item.subtotal)}\n\n`,
          {}
        );
      }
    }

    await BluetoothEscposPrinter.printText(
      "================================\n",
      {}
    );

    // Total
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.RIGHT
    );
    await BluetoothEscposPrinter.printText("TOTAL\n", { fonttype: 1 });
    await BluetoothEscposPrinter.printText(
      `${formatarValor(compra.valorTotal)}\n`,
      { fonttype: 1, widthtimes: 1, heigthtimes: 1 }
    );

    // Status
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText("\n", {});
    await BluetoothEscposPrinter.printText(
      compra.pago ? "[ PAGO ]\n" : "[ PENDENTE ]\n",
      { fonttype: 1 }
    );

    // Observação
    if (compra.observacao) {
      await BluetoothEscposPrinter.printText("\n", {});
      await BluetoothEscposPrinter.printerAlign(
        BluetoothEscposPrinter.ALIGN.LEFT
      );
      await BluetoothEscposPrinter.printText(`Obs: ${compra.observacao}\n`, {});
    }

    // Rodapé
    await BluetoothEscposPrinter.printText(
      "\n================================\n",
      {}
    );
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText("Obrigado pela preferencia!\n", {});
    await BluetoothEscposPrinter.printText(
      `Emitido em ${new Date().toLocaleDateString("pt-BR")}\n`,
      {}
    );

    // Pular linhas e cortar papel
    await BluetoothEscposPrinter.printText("\n\n\n", {});
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.LEFT
    );

    Alert.alert("Sucesso", "Recibo impresso com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao imprimir:", error);
    Alert.alert(
      "Erro na Impressão",
      "Não foi possível imprimir o recibo. Verifique se a impressora está conectada e ligada."
    );
    return false;
  }
};

// Imprimir teste
export const imprimirTeste = async (
  printerAddress?: string
): Promise<boolean> => {
  try {
    if (!BluetoothEscposPrinter) return false;

    if (printerAddress) {
      const conectado = await conectarImpressora(printerAddress);
      if (!conectado) return false;
    }

    await BluetoothEscposPrinter.printerInit();
    await BluetoothEscposPrinter.printerAlign(
      BluetoothEscposPrinter.ALIGN.CENTER
    );
    await BluetoothEscposPrinter.printText("TESTE DE IMPRESSAO\n", {
      fonttype: 1,
      widthtimes: 1,
      heigthtimes: 1,
    });
    await BluetoothEscposPrinter.printText("\n", {});
    await BluetoothEscposPrinter.printText("Caderneta Digital\n", {});
    await BluetoothEscposPrinter.printText("Impressora conectada!\n", {});
    await BluetoothEscposPrinter.printText("\n\n\n", {});

    Alert.alert("Sucesso", "Impressão de teste realizada!");
    return true;
  } catch (error) {
    console.error("Erro ao imprimir teste:", error);
    Alert.alert("Erro", "Falha na impressão de teste.");
    return false;
  }
};
