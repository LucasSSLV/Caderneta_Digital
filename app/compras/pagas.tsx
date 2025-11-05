// app/compras/pagas.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as storage from '../../services/storage';
import { Compra } from '../../types';

interface CompraComCliente extends Compra {
    nomeCliente: string;
}

export default function ComprasPagas() {
    const router = useRouter();
    const [compras, setCompras] = useState<CompraComCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRecebido, setTotalRecebido] = useState(0);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [clientesData, comprasData] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
            ]);

            // Filtrar apenas compras pagas
            const pagas = comprasData
                .filter(c => c.pago)
                .map(compra => {
                    const cliente = clientesData.find(cl => cl.id === compra.clienteId);
                    return {
                        ...compra,
                        nomeCliente: cliente?.nome || 'Cliente não encontrado',
                    };
                })
                .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

            const total = pagas.reduce((sum, c) => sum + c.valorTotal, 0);

            setCompras(pagas);
            setTotalRecebido(total);
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

    const formatarData = (data: string) => {
        const date = new Date(data);
        return date.toLocaleDateString('pt-BR');
    };

    const handleCompraPress = (compra: CompraComCliente) => {
        router.push(`/clientes/${compra.clienteId}`);
    };

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

                <Text style={styles.titulo}>Compras Pagas</Text>
                <Text style={styles.subtitulo}>
                    {compras.length} {compras.length === 1 ? 'compra paga' : 'compras pagas'}
                </Text>
            </View>

            {compras.length > 0 && (
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total Recebido</Text>
                    <Text style={styles.totalValor}>{formatarValor(totalRecebido)}</Text>
                </View>
            )}

            <FlatList
                data={compras}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.compraCard}
                        onPress={() => handleCompraPress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.compraHeader}>
                            <Text style={styles.clienteNome}>{item.nomeCliente}</Text>
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>✓ Pago</Text>
                            </View>
                        </View>

                        {/* <Text style={styles.descricao}>{item.descricao}</Text> */}

                        <View style={styles.compraFooter}>
                            <Text style={styles.data}>{formatarData(item.data)}</Text>
                            <Text style={styles.valor}>{formatarValor(item.valorTotal)}</Text>
                        </View>
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>📋</Text>
                        <Text style={styles.emptyTitle}>Nenhuma compra paga</Text>
                        <Text style={styles.emptySubtitle}>
                            Quando marcar compras como pagas, elas aparecerão aqui
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
    totalCard: {
        backgroundColor: '#E8F5E9',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#27ae60',
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    totalValor: {
        fontSize: 32,
        fontWeight: '700',
        color: '#27ae60',
    },
    lista: {
        paddingVertical: 8,
    },
    compraCard: {
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
    compraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    clienteNome: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    badge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#27ae60',
    },
    descricao: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    compraFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    data: {
        fontSize: 13,
        color: '#999',
    },
    valor: {
        fontSize: 18,
        fontWeight: '700',
        color: '#27ae60',
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