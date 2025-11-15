// app/produtos/historico-movimentacoes.tsx
import { useTheme } from '@/contexts/ThemeContext';
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
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

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
            case 'entrada': return colors.success;
            case 'saida': return colors.danger;
            case 'ajuste': return colors.warning;
            default: return colors.textSecondary;
        }
    };

    const getTipoBackgroundColor = (tipo: string) => {
        switch (tipo) {
            case 'entrada': return colors.cardSuccess;
            case 'saida': return colors.cardDanger;
            case 'ajuste': return colors.cardWarning;
            default: return colors.card;
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
                <View style={[styles.tipoBadge, { backgroundColor: getTipoBackgroundColor(item.tipo) }]}>
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
                <ActivityIndicator size="large" color={colors.primary} />
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

function createStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
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
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        subtitulo: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        lista: {
            paddingVertical: 8,
        },
        movimentacaoCard: {
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginHorizontal: 16,
            marginVertical: 6,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
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
            color: colors.text,
            marginBottom: 4,
        },
        motivo: {
            fontSize: 13,
            color: colors.textSecondary,
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
            borderTopColor: colors.divider,
            borderBottomWidth: 1,
            borderBottomColor: colors.divider,
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
            color: colors.textSecondary,
            marginBottom: 4,
        },
        estoqueValor: {
            fontSize: 20,
            fontWeight: '700',
            color: colors.textSecondary,
        },
        estoqueAtual: {
            color: colors.primary,
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
            color: colors.textSecondary,
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
            color: colors.emptyTitle,
            marginBottom: 8,
            textAlign: 'center',
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
    });
}