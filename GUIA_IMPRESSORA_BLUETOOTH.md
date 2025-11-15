# 🖨️ Guia de Implementação - Impressora Bluetooth

## 📦 Instalação

### 1. Instalar a biblioteca de impressão Bluetooth

```bash
npm install react-native-bluetooth-escpos-printer
```

### 2. Reconstruir o app nativo

```bash
npx expo prebuild --clean
```

### 3. Gerar nova build

```bash
# Para Android
eas build --platform android --profile production

# Ou localmente
npx expo run:android
```

## ✅ Impressoras Compatíveis

Funciona com a maioria das impressoras térmicas portáteis:

### Marcas Populares no Brasil:
- **RPP** (RPP02, RPP03, RPP04)
- **Datecs** (DPP-250, DPP-350)
- **Leopardo** (A7, A8)
- **Xprinter** (XP-P300, XP-P323B)
- **Bematech** (PP-9D)
- **Elgin** (i9)
- **Zebra** (iMZ220, iMZ320)
- **Star Micronics** (SM-L200, SM-S230i)

### Como Identificar:
Qualquer impressora térmica 58mm ou 80mm que:
- Se conecta via Bluetooth
- Usa protocolo ESC/POS
- Aparece nos dispositivos Bluetooth pareados

## 📱 Como Usar

### Para o Usuário Final:

1. **Parear a Impressora**
   - Vá em Configurações do Android
   - Bluetooth
   - Pareie com a impressora (geralmente senha: 0000 ou 1234)

2. **No App**
   - Menu → Configurações
   - "🖨️ Impressora Bluetooth"
   - "Buscar Impressoras"
   - Selecione sua impressora
   - Toque em "Imprimir Teste"

3. **Imprimir Recibo**
   - Entre em qualquer compra
   - Toque em "Ver Recibo"
   - Toque em "🖨️ Imprimir"

## 🔧 Comandos ESC/POS Principais

A biblioteca usa comandos ESC/POS padrão:

```javascript
// Negrito
await BluetoothEscposPrinter.printText('TEXTO', { fonttype: 1 });

// Tamanho maior
await BluetoothEscposPrinter.printText('TEXTO', { 
  widthtimes: 2,  // 2x largura
  heigthtimes: 2  // 2x altura
});

// Alinhamento
await BluetoothEscposPrinter.printerAlign(
  BluetoothEscposPrinter.ALIGN.CENTER // LEFT, CENTER, RIGHT
);

// QR Code (opcional)
await BluetoothEscposPrinter.printQRCode(
  'https://seusite.com',
  250, // tamanho
  BluetoothEscposPrinter.ERROR_CORRECTION.L
);
```

## 🐛 Resolução de Problemas

### Impressora não encontrada
```
Solução:
1. Verifique se está pareada no Bluetooth do celular
2. Ligue a impressora ANTES de buscar
3. Aproxime o celular da impressora
4. Reinicie o Bluetooth
```

### Não imprime
```
Solução:
1. Verifique se a impressora tem papel
2. Verifique se está carregada
3. Tente desconectar e reconectar
4. Faça um teste de impressão primeiro
```

### Impressão saindo cortada
```
Solução:
1. Ajuste o tamanho da fonte no código
2. Para impressoras 58mm, use textos mais curtos
3. Para impressoras 80mm, funciona normal
```

### Permissões negadas
```
Solução:
1. Vá em Configurações do Android
2. Apps → Caderneta Digital → Permissões
3. Ative: Localização, Bluetooth
4. Reinicie o app
```

## 📝 Personalização

### Alterar Layout do Recibo

Edite `services/bluetoothPrinter.ts`:

```typescript
// Adicionar logo (se suportado)
await BluetoothEscposPrinter.printPic(logo, { width: 200 });

// Adicionar QR Code
await BluetoothEscposPrinter.printQRCode(
  `tel:${cliente.telefone}`, // Link para ligar
  200
);

// Adicionar linha tracejada
await BluetoothEscposPrinter.printText('- - - - - - - - -\n', {});
```

### Testar Comandos

No arquivo `bluetoothPrinter.ts`, função `imprimirTeste()`:

```typescript
export const imprimirTeste = async () => {
  // Adicione seus testes aqui
  await BluetoothEscposPrinter.printText('TESTE\n', { 
    fonttype: 1,
    widthtimes: 3,
    heigthtimes: 3
  });
};
```

## 🎯 Recursos Avançados (Opcional)

### Imprimir código de barras
```typescript
await BluetoothEscposPrinter.printBarCode(
  '1234567890',
  BluetoothEscposPrinter.BARCODETYPE.CODE128,
  3,   // largura
  120, // altura
  2,   // posição do texto
  2    // fonte
);
```

### Imprimir imagem/logo
```typescript
import { Image } from 'react-native';

const logo = require('./logo.png');
await BluetoothEscposPrinter.printPic(logo, {
  width: 200,
  left: 100
});
```

### Tabela com colunas alinhadas
```typescript
await BluetoothEscposPrinter.printColumn(
  [12, 12, 12],  // largura das colunas
  [
    BluetoothEscposPrinter.ALIGN.LEFT,
    BluetoothEscposPrinter.ALIGN.CENTER,
    BluetoothEscposPrinter.ALIGN.RIGHT
  ],
  ['Item', 'Qtd', 'Valor'],
  {}
);
```

## 💡 Dicas

1. **Sempre teste** com "Impressão de Teste" primeiro
2. **Mantenha a impressora próxima** durante a impressão
3. **Use papel térmico de qualidade** para melhor resultado
4. **Bateria**: Carregue antes de usar
5. **Compatibilidade**: 99% das impressoras térmicas funcionam

## 📊 Custo de Impressoras

- **Básicas (58mm)**: R$ 200 - R$ 400
- **Intermediárias (80mm)**: R$ 400 - R$ 800
- **Profissionais**: R$ 800+

## 🔗 Links Úteis

- Documentação ESC/POS: https://reference.epson-biz.com/modules/ref_escpos/
- Biblioteca: https://github.com/januslo/react-native-bluetooth-escpos-printer
- Testes: Use app "BlueTooth Printer" da Play Store para testar comandos

## ✨ Próximas Melhorias

- [ ] Salvar múltiplas impressoras
- [ ] Templates de recibo personalizáveis
- [ ] Imprimir logo da empresa
- [ ] Imprimir QR Code para pagamento PIX
- [ ] Imprimir código de barras
- [ ] Histórico de impressões
- [ ] Configurar número de vias