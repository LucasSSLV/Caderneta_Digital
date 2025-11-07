// app/relatorios/index.tsx - Estatísticas e Relatórios
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as storage from '../../services/storage';
import { Cliente, Compra, Produto } from '../../types';

interface ProdutoVendido {
    produtoId: string;
    nomeProduto: string;
    quantidadeVendida: number;
    totalVendido: number;
}

interface ClienteRanking {
    cliente: Cliente;
    totalComprado: number;
    quantidadeCompras: number;
}

export default function Relatorios() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [produtos, setProdutos] = useState<Produto[]>([]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [clientesData, comprasData, produtosData] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
                storage.carregarProdutos(),
            ]);
            setClientes(clientesData);
            setCompras(comprasData);
            setProdutos(produtosData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [])
    );

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    // Estatísticas Gerais
    const calcularEstatisticasGerais = () => {
        const totalVendido = compras
            .filter(c => c.pago)
            .reduce((sum, c) => sum + c.valorTotal, 0);

        const totalPendente = compras
            .filter(c => !c.pago)
            .reduce((sum, c) => sum + c.valorTotal, 0);

        const ticketMedio = compras.length > 0
            ? compras.reduce((sum, c) => sum + c.valorTotal, 0) / compras.length
            : 0;

        const taxaPagamento = compras.length > 0
            ? (compras.filter(c => c.pago).length / compras.length) * 100
            : 0;

        return {
            totalVendido,
            totalPendente,
            ticketMedio,
            taxaPagamento,
            totalCompras: compras.length,
            totalClientes: clientes.length,
            totalProdutos: produtos.length,
        };
    };

    // Top 5 Produtos Mais Vendidos
    const calcularProdutosMaisVendidos = (): ProdutoVendido[] => {
        const produtosMap = new Map<string, ProdutoVendido>();

        compras.forEach(compra => {
            if (compra.itens) {
                compra.itens.forEach(item => {
                    const existing = produtosMap.get(item.produtoId);

                    if (existing) {
                        existing.quantidadeVendida += item.quantidade;
                        existing.totalVendido += item.subtotal;
                    } else {
                        produtosMap.set(item.produtoId, {
                            produtoId: item.produtoId,
                            nomeProduto: item.nomeProduto,
                            quantidadeVendida: item.quantidade,
                            totalVendido: item.subtotal,
                        });
                    }
                });
            }
        });

        return Array.from(produtosMap.values())
            .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida)
            .slice(0, 5);
    };

    // Top 5 Clientes que Mais Compraram
    const calcularClientesTopCompradores = (): ClienteRanking[] => {
        return clientes
            .map(cliente => {
                const comprasCliente = compras.filter(c => c.clienteId === cliente.id);
                const totalComprado = comprasCliente.reduce((sum, c) => sum + c.valorTotal, 0);

                return {
                    cliente,
                    totalComprado,
                    quantidadeCompras: comprasCliente.length,
                };
            })
            .filter(item => item.totalComprado > 0)
            .sort((a, b) => b.totalComprado - a.totalComprado)
            .slice(0, 5);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando relatórios...</Text>
            </View>
        );
    }

    const stats = calcularEstatisticasGerais();
    const topProdutos = calcularProdutosMaisVendidos();
    const topClientes = calcularClientesTopCompradores();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>📊 Relatórios</Text>
                <Text style={styles.subtitulo}>Estatísticas do seu negócio</Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Estatísticas Gerais */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resumo Geral</Text>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
                            <Text style={styles.statValue}>{formatarValor(stats.totalVendido)}</Text>
                            <Text style={styles.statLabel}>Total Vendido</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
                            <Text style={styles.statValue}>{formatarValor(stats.totalPendente)}</Text>
                            <Text style={styles.statLabel}>A Receber</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
                            <Text style={styles.statValue}>{formatarValor(stats.ticketMedio)}</Text>
                            <Text style={styles.statLabel}>Ticket Médio</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
                            <Text style={styles.statValue}>{stats.taxaPagamento.toFixed(1)}%</Text>
                            <Text style={styles.statLabel}>Taxa Pagamento</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>{stats.totalCompras}</Text>
                            <Text style={styles.infoLabel}>Compras Totais</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>{stats.totalClientes}</Text>
                            <Text style={styles.infoLabel}>Clientes</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoValue}>{stats.totalProdutos}</Text>
                            <Text style={styles.infoLabel}>Produtos</Text>
                        </View>
                    </View>
                </View>

                {/* Top Produtos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏆 Top 5 Produtos Mais Vendidos</Text>

                    {topProdutos.length > 0 ? (
                        topProdutos.map((produto, index) => (
                            <View key={produto.produtoId} style={styles.rankCard}>
                                <View style={styles.rankPosition}>
                                    <Text style={styles.rankNumber}>{index + 1}º</Text>
                                </View>
                                <View style={styles.rankInfo}>
                                    <Text style={styles.rankName}>{produto.nomeProduto}</Text>
                                    <Text style={styles.rankDetail}>
                                        {produto.quantidadeVendida} unidades vendidas
                                    </Text>
                                </View>
                                <View style={styles.rankValue}>
                                    <Text style={styles.rankValueText}>
                                        {formatarValor(produto.totalVendido)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Nenhuma venda registrada ainda</Text>
                        </View>
                    )}
                </View>

                {/* Top Clientes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👑 Top 5 Melhores Clientes</Text>

                    {topClientes.length > 0 ? (
                        topClientes.map((item, index) => (
                            <View key={item.cliente.id} style={styles.rankCard}>
                                <View style={styles.rankPosition}>
                                    <Text style={styles.rankNumber}>{index + 1}º</Text>
                                </View>
                                <View style={styles.rankInfo}>
                                    <Text style={styles.rankName}>{item.cliente.nome}</Text>
                                    <Text style={styles.rankDetail}>
                                        {item.quantidadeCompras} compras realizadas
                                    </Text>
                                </View>
                                <View style={styles.rankValue}>
                                    <Text style={styles.rankValueText}>
                                        {formatarValor(item.totalComprado)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyText}>Nenhum cliente com compras</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
        color: '#1a1a1a',
        marginBottom: 4,
    },
    subtitulo: {
        fontSize: 14,
        color: '#666',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        width: '48%',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#666',
    },
    infoRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    infoItem: {
        flex: 1,
        alignItems: 'center',
    },
    infoValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4,
    },
    infoLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    rankCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rankPosition: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    rankInfo: {
        flex: 1,
    },
    rankName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    rankDetail: {
        fontSize: 13,
        color: '#666',
    },
    rankValue: {
        alignItems: 'flex-end',
    },
    rankValueText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27ae60',
    },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    emptyText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});