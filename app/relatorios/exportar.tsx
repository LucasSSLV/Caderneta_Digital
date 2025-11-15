// app/relatorios/exportar.tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import * as storage from '../../services/storage';

export default function ExportarRelatorios() {
    const router = useRouter();
    const [exportando, setExportando] = useState(false);
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);


    const gerarRelatorioCompleto = async () => {
        try {
            setExportando(true);

            const [clientes, compras, produtos, movimentacoes] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
                storage.carregarProdutos(),
                storage.carregarMovimentacoes(),
            ]);

            const relatorio = {
                dataExportacao: new Date().toISOString(),
                resumo: {
                    totalClientes: clientes.length,
                    totalProdutos: produtos.length,
                    totalCompras: compras.length,
                    comprasPagas: compras.filter(c => c.pago).length,
                    comprasPendentes: compras.filter(c => !c.pago).length,
                    totalMovimentacoes: movimentacoes.length,
                },
                dados: {
                    clientes,
                    compras,
                    produtos,
                    movimentacoes,
                }
            };

            return JSON.stringify(relatorio, null, 2);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setExportando(false);
        }
    };

    const gerarRelatorioClientes = async () => {
        try {
            setExportando(true);

            const [clientes, compras] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
            ]);

            const clientesComDividas = clientes.map(cliente => {
                const comprasCliente = compras.filter(c => c.clienteId === cliente.id);
                const totalDevido = storage.calcularTotalDevido(comprasCliente);
                const totalCompras = comprasCliente.reduce((sum, c) => sum + c.valorTotal, 0);

                return {
                    ...cliente,
                    quantidadeCompras: comprasCliente.length,
                    totalCompras,
                    totalDevido,
                };
            });

            const relatorio = {
                dataExportacao: new Date().toISOString(),
                tipo: 'Relatório de Clientes',
                clientes: clientesComDividas,
            };

            return JSON.stringify(relatorio, null, 2);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setExportando(false);
        }
    };

    const gerarRelatorioProdutos = async () => {
        try {
            setExportando(true);

            const [produtos, movimentacoes] = await Promise.all([
                storage.carregarProdutos(),
                storage.carregarMovimentacoes(),
            ]);

            const produtosComMovimentacao = produtos.map(produto => {
                const movimentacoesProduto = movimentacoes.filter(m => m.produtoId === produto.id);
                const totalEntradas = movimentacoesProduto
                    .filter(m => m.tipo === 'entrada')
                    .reduce((sum, m) => sum + m.quantidade, 0);
                const totalSaidas = movimentacoesProduto
                    .filter(m => m.tipo === 'saida')
                    .reduce((sum, m) => sum + m.quantidade, 0);

                return {
                    ...produto,
                    totalEntradas,
                    totalSaidas,
                    saldoMovimentacao: totalEntradas - totalSaidas,
                };
            });

            const relatorio = {
                dataExportacao: new Date().toISOString(),
                tipo: 'Relatório de Produtos e Estoque',
                produtos: produtosComMovimentacao,
            };

            return JSON.stringify(relatorio, null, 2);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setExportando(false);
        }
    };

    const gerarRelatorioFinanceiro = async () => {
        try {
            setExportando(true);

            const compras = await storage.carregarCompras();

            const totalVendido = compras
                .filter(c => c.pago)
                .reduce((sum, c) => sum + c.valorTotal, 0);

            const totalPendente = compras
                .filter(c => !c.pago)
                .reduce((sum, c) => sum + c.valorTotal, 0);

            const comprasPorMes = compras.reduce((acc, compra) => {
                const mes = new Date(compra.data).toISOString().substring(0, 7);
                if (!acc[mes]) {
                    acc[mes] = { total: 0, pagas: 0, pendentes: 0 };
                }
                acc[mes].total += compra.valorTotal;
                if (compra.pago) {
                    acc[mes].pagas += compra.valorTotal;
                } else {
                    acc[mes].pendentes += compra.valorTotal;
                }
                return acc;
            }, {} as Record<string, any>);

            const relatorio = {
                dataExportacao: new Date().toISOString(),
                tipo: 'Relatório Financeiro',
                resumo: {
                    totalVendido,
                    totalPendente,
                    totalGeral: totalVendido + totalPendente,
                    ticketMedio: compras.length > 0 ? (totalVendido + totalPendente) / compras.length : 0,
                    taxaPagamento: compras.length > 0 ? (compras.filter(c => c.pago).length / compras.length) * 100 : 0,
                },
                comprasPorMes,
                todasCompras: compras,
            };

            return JSON.stringify(relatorio, null, 2);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setExportando(false);
        }
    };

    const compartilharRelatorio = async (relatorio: string, titulo: string) => {
        try {
            await Share.share({
                message: relatorio,
                title: titulo,
            });
        } catch (error) {
            console.error(error);
            Alert.alert('Erro', 'Não foi possível compartilhar o relatório.');
        }
    };

    const handleExportar = async (tipo: string) => {
        try {
            let relatorio: string;
            let titulo: string;

            switch (tipo) {
                case 'completo':
                    relatorio = await gerarRelatorioCompleto();
                    titulo = 'Relatório Completo';
                    break;
                case 'clientes':
                    relatorio = await gerarRelatorioClientes();
                    titulo = 'Relatório de Clientes';
                    break;
                case 'produtos':
                    relatorio = await gerarRelatorioProdutos();
                    titulo = 'Relatório de Produtos';
                    break;
                case 'financeiro':
                    relatorio = await gerarRelatorioFinanceiro();
                    titulo = 'Relatório Financeiro';
                    break;
                default:
                    return;
            }

            await compartilharRelatorio(relatorio, titulo);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível gerar o relatório.');
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                    disabled={exportando}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>📊 Exportar Relatórios</Text>
                <Text style={styles.subtitulo}>Escolha o tipo de relatório para exportar</Text>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.info}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <Text style={styles.infoText}>
                        Os relatórios serão exportados em formato JSON. Você pode compartilhá-los via WhatsApp, email ou salvá-los no seu dispositivo.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.exportCard}
                    onPress={() => handleExportar('completo')}
                    disabled={exportando}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#E3F2FD' }]}>
                        <Text style={styles.cardIconText}>📦</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Relatório Completo</Text>
                        <Text style={styles.cardDescription}>
                            Exporta todos os dados: clientes, produtos, compras e movimentações
                        </Text>
                    </View>
                    <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.exportCard}
                    onPress={() => handleExportar('clientes')}
                    disabled={exportando}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#F3E5F5' }]}>
                        <Text style={styles.cardIconText}>👥</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Relatório de Clientes</Text>
                        <Text style={styles.cardDescription}>
                            Lista de clientes com total de compras e valores devidos
                        </Text>
                    </View>
                    <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.exportCard}
                    onPress={() => handleExportar('produtos')}
                    disabled={exportando}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={styles.cardIconText}>📦</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Relatório de Produtos</Text>
                        <Text style={styles.cardDescription}>
                            Produtos cadastrados com estoque e movimentações
                        </Text>
                    </View>
                    <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.exportCard}
                    onPress={() => handleExportar('financeiro')}
                    disabled={exportando}
                    activeOpacity={0.7}
                >
                    <View style={[styles.cardIcon, { backgroundColor: '#FFF3E0' }]}>
                        <Text style={styles.cardIconText}>💰</Text>
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>Relatório Financeiro</Text>
                        <Text style={styles.cardDescription}>
                            Resumo financeiro com vendas, recebimentos e valores pendentes
                        </Text>
                    </View>
                    <Text style={styles.cardArrow}>›</Text>
                </TouchableOpacity>
            </ScrollView>

            {exportando && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.loadingText}>Gerando relatório...</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

function createStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor:colors.card,
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
            color: '#007AFF',
            fontWeight: '500',
        },
        titulo: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        subtitulo: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        content: {
            flex: 1,
            padding: 16,
        },
        info: {
            flexDirection: 'row',
            backgroundColor: colors.info,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            shadowColor: colors.shadow,
        },
        infoIcon: {
            fontSize: 24,
            marginRight: 12,
        },
        infoText: {
            flex: 1,
            fontSize: 14,
            color: colors.danger,
            lineHeight: 20,
        },
        exportCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
        cardIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
        },
        cardIconText: {
            fontSize: 28,
        },
        cardContent: {
            flex: 1,
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        cardDescription: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 18,
        },
        cardArrow: {
            fontSize: 28,
            color: colors.primary,
            fontWeight: '300',
        },
        loadingOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingCard: {
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 32,
            alignItems: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        loadingText: {
            marginTop: 16,
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
        },
    });
}