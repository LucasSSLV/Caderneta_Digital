// app/clientes/devedores.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClienteCard from '../../components/ClientCard';
import * as storage from '../../services/storage';
import { Cliente, Compra } from '../../types';

export default function ClientesDevedores() {
    const router = useRouter();
    const [clientesDevedores, setClientesDevedores] = useState<Cliente[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalGeral, setTotalGeral] = useState(0);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [clientesData, comprasData] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
            ]);

            // Filtrar apenas clientes que têm dívidas
            const devedores = clientesData.filter(cliente => {
                const comprasCliente = comprasData.filter(c => c.clienteId === cliente.id);
                const totalDevido = storage.calcularTotalDevido(comprasCliente);
                return totalDevido > 0;
            });

            // Ordenar por valor devido (maior para menor)
            devedores.sort((a, b) => {
                const totalA = storage.calcularTotalDevido(
                    comprasData.filter(c => c.clienteId === a.id)
                );
                const totalB = storage.calcularTotalDevido(
                    comprasData.filter(c => c.clienteId === b.id)
                );
                return totalB - totalA;
            });

            // Calcular total geral
            const total = comprasData
                .filter(c => !c.pago)
                .reduce((sum, c) => sum + c.valor, 0);

            setClientesDevedores(devedores);
            setCompras(comprasData);
            setTotalGeral(total);
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

    const calcularTotalDevido = (clienteId: string) => {
        const comprasCliente = compras.filter(c => c.clienteId === clienteId);
        return storage.calcularTotalDevido(comprasCliente);
    };

    const handleClientePress = (clienteId: string) => {
        router.push(`/clientes/${clienteId}`);
    };

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
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

                <Text style={styles.titulo}>Clientes Devedores</Text>
                <Text style={styles.subtitulo}>
                    {clientesDevedores.length} {clientesDevedores.length === 1 ? 'cliente devedor' : 'clientes devedores'}
                </Text>
            </View>

            {clientesDevedores.length > 0 && (
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total a Receber</Text>
                    <Text style={styles.totalValor}>{formatarValor(totalGeral)}</Text>
                </View>
            )}

            <FlatList
                data={clientesDevedores}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ClienteCard
                        cliente={item}
                        totalDevido={calcularTotalDevido(item.id)}
                        onPress={() => handleClientePress(item.id)}
                    />
                )}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>🎉</Text>
                        <Text style={styles.emptyTitle}>Nenhum cliente devedor</Text>
                        <Text style={styles.emptySubtitle}>
                            Todas as contas estão em dia!
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
        backgroundColor: '#FFEBEE',
        margin: 16,
        padding: 20,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#e74c3c',
    },
    totalLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    totalValor: {
        fontSize: 32,
        fontWeight: '700',
        color: '#e74c3c',
    },
    lista: {
        paddingVertical: 8,
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