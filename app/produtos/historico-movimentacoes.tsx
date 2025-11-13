// app/produtos/historico-movimentacoes.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import * as storage from '../../services/storage';

interface Movimentacao {
    id: string;
    produtoId: string;
    nomeProduto: string;
    tipo: 'entrada' | 'saida' | 'ajuste';
    quantidade: number;
    estoqueAnterior: number;
    estoqueAtual: number;
    motivo: string;
    data: string;
}

export default function HistoricoMovimentacoes() {
    const router = useRouter();
    const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarMovimentacoes = async () => {
        try {
            setLoading(true);
            const data = await storage.carregarMovimentacoes();
            // Ordenar por data (mais recente primeiro)
            const ordenadas = data.sort((a, b) =>
                new Date(b.data).getTime() - new Date(a.data).getTime()
            );
            setMovimentacoes(ordenadas);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarMovimentacoes();
        }, [])
    );

    const formatarData = (data: string) => {
        const date = new Date(data);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return '📥';
            case 'saida': return '📤';
            case 'ajuste': return '⚙️';
            default: return '📦';
        }
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return '#27ae60';
            case 'saida': return '#e74c3c';
            case 'ajuste': return '#f39c12';
            default: return '#666';
        }
    };

    const getTipoText = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return 'Entrada';
            case 'saida': return 'Saída';
            case 'ajuste': return 'Ajuste';
            default: return tipo;
        }
    };

    const renderMovimentacao = ({ item }: { item: Movimentacao }) => (
        <View style={styles.movimentacaoCard}>
            <View style={styles.cardHeader}>
                <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome}>{item.nomeProduto}</Text>
                    <Text style={styles.motivo}>{item.motivo}</Text>
                </View>
                <View style={[styles.tipoBadge, { backgroundColor: getTipoColor(item.tipo) + '20' }]}>
                    <Text style={styles.tipoIcon}>{getTipoIcon(item.tipo)}</Text>
                    <Text style={[styles.tipoText, { color: getTipoColor(item.tipo) }]}>
                        {getTipoText(item.tipo)}
                    </Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.estoqueRow}>
                    <View style={styles.estoqueItem}>
                        <Text style={styles.estoqueLabel}>Anterior</Text>
                        <Text style={styles.estoqueValor}>{item.estoqueAnterior}</Text>
                    </View>

                    <View style={styles.quantidadeContainer}>
                        <Text style={[
                            styles.quantidade,
                            { color: getTipoColor(item.tipo) }
                        ]}>
                            {item.tipo === 'entrada' ? '+' : item.tipo === 'saida' ? '-' : ''}
                            {item.quantidade}
                        </Text>
                    </View>

                    <View style={styles.estoqueItem}>
                        <Text style={styles.estoqueLabel}>Atual</Text>
                        <Text style={[styles.estoqueValor, styles.estoqueAtual]}>
                            {item.estoqueAtual}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.data}>{formatarData(item.data)}</Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
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

                <Text style={styles.titulo}>📋 Histórico de Movimentações</Text>
                <Text style={styles.subtitulo}>
                    {movimentacoes.length} {movimentacoes.length === 1 ? 'movimentação' : 'movimentações'}
                </Text>
            </View>

            <FlatList
                data={movimentacoes}
                keyExtractor={item => item.id}
                renderItem={renderMovimentacao}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>📋</Text>
                        <Text style={styles.emptyTitle}>Nenhuma movimentação registrada</Text>
                        <Text style={styles.emptySubtitle}>
                            As entradas e saídas de estoque aparecerão aqui
                        </Text>
                    </View>
                }
            />
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
    lista: {
        paddingVertical: 8,
    },
    movimentacaoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    produtoInfo: {
        flex: 1,
        marginRight: 12,
    },
    produtoNome: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    motivo: {
        fontSize: 13,
        color: '#666',
    },
    tipoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    tipoIcon: {
        fontSize: 16,
    },
    tipoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    cardBody: {
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    estoqueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    estoqueItem: {
        alignItems: 'center',
        flex: 1,
    },
    estoqueLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4,
    },
    estoqueValor: {
        fontSize: 20,
        fontWeight: '700',
        color: '#666',
    },
    estoqueAtual: {
        color: '#007AFF',
    },
    quantidadeContainer: {
        paddingHorizontal: 20,
    },
    quantidade: {
        fontSize: 24,
        fontWeight: '700',
    },
    cardFooter: {
        marginTop: 12,
    },
    data: {
        fontSize: 12,
        color: '#999',
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});