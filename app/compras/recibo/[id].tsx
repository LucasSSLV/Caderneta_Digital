// app/compras/recibo/[id].tsx - Visualizador de Recibo
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import * as receiptService from '../../../services/receipt';
import * as storage from '../../../services/storage';
import { Cliente, Compra } from '../../../types';

export default function ReciboScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors, isDark } = useTheme();

    const [compra, setCompra] = useState<Compra | null>(null);
    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [dadosEmpresa, setDadosEmpresa] = useState<receiptService.DadosEmpresa | null>(null);
    const [loading, setLoading] = useState(true);
    const [numeroRecibo, setNumeroRecibo] = useState('');

    const styles = createStyles(colors, isDark);

    useEffect(() => {
        carregarDados();
    }, [id]);

    const carregarDados = async () => {
        try {
            setLoading(true);

            if (!id) {
                Alert.alert('Erro', 'Compra não encontrada');
                router.back();
                return;
            }

            const compras = await storage.carregarCompras();
            const compraEncontrada = compras.find(c => c.id === id);

            if (!compraEncontrada) {
                Alert.alert('Erro', 'Compra não encontrada');
                router.back();
                return;
            }

            const clienteData = await storage.buscarClientePorId(compraEncontrada.clienteId);
            const empresa = await receiptService.carregarDadosEmpresa();
            const numero = receiptService.gerarNumeroRecibo(id);

            setCompra(compraEncontrada);
            setCliente(clienteData);
            setDadosEmpresa(empresa);
            setNumeroRecibo(numero);
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleCompartilhar = async () => {
        if (!compra || !cliente) return;

        Alert.alert(
            'Compartilhar Recibo',
            'Como deseja compartilhar?',
            [
                {
                    text: 'WhatsApp',
                    onPress: () => receiptService.enviarReciboWhatsApp(cliente, compra, numeroRecibo),
                },
                {
                    text: 'Outros Apps',
                    onPress: () => receiptService.compartilharReciboTexto(cliente, compra, numeroRecibo),
                },
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
            ]
        );
    };

    const handleImprimir = async () => {
        if (!compra || !cliente) return;

        try {
            // Buscar impressora padrão
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const printerAddress = await AsyncStorage.getItem('@caderneta:impressora_padrao');

            if (!printerAddress) {
                Alert.alert(
                    'Impressora não configurada',
                    'Configure uma impressora Bluetooth nas configurações antes de imprimir.',
                    [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                            text: 'Configurar',
                            onPress: () => router.push('/configuracoes/impressora')
                        }
                    ]
                );
                return;
            }

            // Importar dinamicamente o serviço de impressão
            const bluetoothPrinter = require('../../../services/bluetoothPrinter');

            Alert.alert(
                'Imprimir Recibo',
                'Certifique-se de que a impressora está ligada e próxima.',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Imprimir',
                        onPress: async () => {
                            await bluetoothPrinter.imprimirRecibo(
                                cliente,
                                compra,
                                numeroRecibo,
                                printerAddress
                            );
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Erro ao imprimir:', error);
            Alert.alert(
                'Erro',
                'Não foi possível imprimir o recibo. Verifique se a impressora está configurada e conectada.'
            );
        }
    };

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const formatarData = (data: string) => {
        return new Date(data).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando recibo...</Text>
            </View>
        );
    }

    if (!compra || !cliente || !dadosEmpresa) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.titulo}>Recibo #{numeroRecibo}</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.recibo}>
                    {/* Cabeçalho da Empresa */}
                    <View style={styles.empresaHeader}>
                        <Text style={styles.empresaNome}>{dadosEmpresa.nome.toUpperCase()}</Text>
                        {dadosEmpresa.cnpj && (
                            <Text style={styles.empresaInfo}>CNPJ: {dadosEmpresa.cnpj}</Text>
                        )}
                        {dadosEmpresa.telefone && (
                            <Text style={styles.empresaInfo}>Tel: {dadosEmpresa.telefone}</Text>
                        )}
                        {dadosEmpresa.endereco && (
                            <Text style={styles.empresaInfo}>{dadosEmpresa.endereco}</Text>
                        )}
                        {dadosEmpresa.cidade && (
                            <Text style={styles.empresaInfo}>{dadosEmpresa.cidade}</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Título */}
                    <View style={styles.tituloContainer}>
                        <Text style={styles.reciboTitulo}>RECIBO DE VENDA</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Informações */}
                    <View style={styles.infoSection}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Nº:</Text>
                            <Text style={styles.infoValue}>{numeroRecibo}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Data:</Text>
                            <Text style={styles.infoValue}>{formatarData(compra.data)}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cliente:</Text>
                            <Text style={[styles.infoValue, styles.infoValueBold]}>{cliente.nome}</Text>
                        </View>
                        {cliente.telefone && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Tel:</Text>
                                <Text style={styles.infoValue}>{cliente.telefone}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Itens */}
                    <View style={styles.itensSection}>
                        <Text style={styles.sectionTitle}>ITENS</Text>

                        {compra.itens && compra.itens.length > 0 ? (
                            compra.itens.map((item, index) => (
                                <View key={index} style={styles.itemCard}>
                                    <Text style={styles.itemNome}>{item.nomeProduto}</Text>
                                    <Text style={styles.itemDetalhes}>
                                        {item.quantidade} {item.tipo === 'unidade' ? 'un' : 'cx'} × {formatarValor(item.precoUnitario)}
                                    </Text>
                                    <Text style={styles.itemSubtotal}>
                                        Subtotal: {formatarValor(item.subtotal)}
                                    </Text>
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Nenhum item</Text>
                        )}
                    </View>

                    <View style={styles.divider} />

                    {/* Total */}
                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>{formatarValor(compra.valorTotal)}</Text>
                    </View>

                    {/* Status */}
                    <View style={[
                        styles.statusBadge,
                        compra.pago ? styles.statusPago : styles.statusPendente
                    ]}>
                        <Text style={styles.statusText}>
                            {compra.pago ? '✓ PAGO' : '⏳ PENDENTE'}
                        </Text>
                    </View>

                    {/* Observação */}
                    {compra.observacao && (
                        <View style={styles.observacaoBox}>
                            <Text style={styles.observacaoLabel}>Observação:</Text>
                            <Text style={styles.observacaoTexto}>{compra.observacao}</Text>
                        </View>
                    )}

                    <View style={styles.divider} />

                    {/* Rodapé */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Obrigado pela preferência!</Text>
                        <Text style={styles.footerData}>
                            Emitido em {new Date().toLocaleDateString('pt-BR')}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Botões de Ação */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonPrimary]}
                    onPress={handleCompartilhar}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonIcon}>📤</Text>
                    <Text style={styles.actionButtonText}>Compartilhar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={handleImprimir}
                    activeOpacity={0.8}
                >
                    <Text style={styles.actionButtonIcon}>🖨️</Text>
                    <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
                        Imprimir
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function createStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            marginBottom: 60,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        loadingText: {
            marginTop: 12,
            fontSize: 16,
            color: colors.textSecondary,
        },
        header: {
            backgroundColor: colors.card,
            paddingTop: 60,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        btnVoltar: {
            marginBottom: 12,
        },
        btnVoltarText: {
            fontSize: 16,
            color: colors.primary,
            fontWeight: '500',
        },
        titulo: {
            fontSize: 24,
            fontWeight: '700',
            color: colors.text,
        },
        content: {
            flex: 1,
        },
        recibo: {
            backgroundColor: colors.card,
            margin: 16,
            padding: 20,
            borderRadius: 12,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        empresaHeader: {
            alignItems: 'center',
            marginBottom: 20,
        },
        empresaNome: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        empresaInfo: {
            fontSize: 13,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 18,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 16,
        },
        tituloContainer: {
            alignItems: 'center',
            paddingVertical: 12,
        },
        reciboTitulo: {
            fontSize: 18,
            fontWeight: '700',
            color: colors.text,
            letterSpacing: 1,
        },
        infoSection: {
            gap: 8,
        },
        infoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        infoLabel: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        infoValue: {
            fontSize: 14,
            color: colors.text,
        },
        infoValueBold: {
            fontWeight: '700',
        },
        itensSection: {
            gap: 12,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            textAlign: 'center',
            marginBottom: 8,
        },
        itemCard: {
            padding: 12,
            backgroundColor: colors.background,
            borderRadius: 8,
            marginBottom: 8,
        },
        itemNome: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        itemDetalhes: {
            fontSize: 13,
            color: colors.textSecondary,
            marginBottom: 4,
            marginLeft: 8,
        },
        itemSubtotal: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
            marginLeft: 8,
        },
        emptyText: {
            textAlign: 'center',
            color: colors.textSecondary,
            fontSize: 14,
            fontStyle: 'italic',
        },
        totalSection: {
            alignItems: 'flex-end',
            paddingVertical: 16,
        },
        totalLabel: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 8,
        },
        totalValue: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.primary,
        },
        statusBadge: {
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginVertical: 16,
        },
        statusPago: {
            backgroundColor: isDark ? colors.cardSuccess : '#E8F5E9',
        },
        statusPendente: {
            backgroundColor: isDark ? colors.cardWarning : '#FFF3E0',
        },
        statusText: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
        },
        observacaoBox: {
            padding: 12,
            backgroundColor: colors.background,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
            borderRadius: 4,
            marginVertical: 16,
        },
        observacaoLabel: {
            fontSize: 13,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        observacaoTexto: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        footer: {
            alignItems: 'center',
            marginTop: 16,
        },
        footerText: {
            fontSize: 14,
            color: colors.text,
            marginBottom: 4,
        },
        footerData: {
            fontSize: 11,
            color: colors.textSecondary,
        },
        actionsContainer: {
            flexDirection: 'row',
            gap: 12,
            padding: 16,
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        actionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 16,
            borderRadius: 12,
            gap: 8,
        },
        actionButtonPrimary: {
            backgroundColor: colors.primary,
        },
        actionButtonSecondary: {
            backgroundColor: colors.background,
            borderWidth: 2,
            borderColor: colors.primary,
        },
        actionButtonIcon: {
            fontSize: 20,
        },
        actionButtonText: {
            fontSize: 16,
            fontWeight: '700',
            color: '#fff',
        },
        actionButtonTextSecondary: {
            color: colors.primary,
        },
    });
}