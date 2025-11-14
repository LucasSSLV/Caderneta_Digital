// app/clientes/[id].tsx
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CompraItem from '../../components/CompraItem';
import TotalDevido from '../../components/TotalDevido';
import * as storage from '../../services/storage';
import * as whatsappService from '../../services/whataspp';
import { Cliente, Compra } from '../../types';

export default function ClienteDetalhes() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);

    const handleCompartilharExtrato = () => {
        if (!cliente) return;

        const resumo = calcularResumo();
        whatsappService.compartilharExtratoCliente(
            cliente,
            compras,
            resumo.total
        );
    };

    const handleEnviarCobranca = () => {
        if (!cliente) return;

        const resumo = calcularResumo();

        if (resumo.total === 0) {
            Alert.alert(
                'Sem pendências',
                'Este cliente não possui valores pendentes.'
            );
            return;
        }

        whatsappService.compartilharCobranca(cliente, resumo.total);
    };

    const carregarDados = async () => {
        try {
            setLoading(true);

            if (!id) {
                if (Platform.OS === 'web') alert('Erro: Cliente não encontrado');
                else Alert.alert('Erro', 'Cliente não encontrado');
                router.back();
                return;
            }

            const [clienteData, comprasData] = await Promise.all([
                storage.buscarClientePorId(id),
                storage.buscarComprasPorCliente(id),
            ]);

            if (!clienteData) {
                if (Platform.OS === 'web') alert('Erro: Cliente não encontrado');
                else Alert.alert('Erro', 'Cliente não encontrado');
                router.back();
                return;
            }

            setCliente(clienteData);
            setCompras(comprasData);
        } catch (error) {
            if (Platform.OS === 'web') alert('Erro: Não foi possível carregar os dados.');
            else Alert.alert('Erro', 'Não foi possível carregar os dados.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarDados();
        }, [id])
    );

    // useEffect(() => {
    //     console.log("O estado 'compras' foi atualizado:", compras);
    // }, [compras]);

    const handleTogglePago = async (compraId: string) => {
        try {
            await storage.toggleCompraStatus(compraId);
            await carregarDados();
        } catch (error) {
            if (Platform.OS === 'web') alert('Erro: Não foi possível atualizar o status da compra.');
            else Alert.alert('Erro', 'Não foi possível atualizar o status da compra.');
        }
    };

    const handleDeleteCompra = (compraId: string) => {
        const performDelete = async () => {
            try {
                // Optimistic UI update
                setCompras(prevCompras => prevCompras.filter(c => c.id !== compraId));

                await storage.excluirCompra(compraId);

                if (Platform.OS === 'web') {
                    alert('Compra excluída com sucesso!');
                } else {
                    Alert.alert('Sucesso', 'Compra excluída com sucesso!');
                }
            } catch (error) {
                if (Platform.OS === 'web') {
                    alert('Não foi possível excluir a compra.');
                } else {
                    Alert.alert('Erro', 'Não foi possível excluir a compra.');
                }
                // If error, roll back the optimistic update
                carregarDados();
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Deseja excluir?')) {
                performDelete();
            }
        } else {
            Alert.alert(
                'Excluir Compra',
                'Deseja excluir?',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Excluir',
                        style: 'destructive',
                        onPress: performDelete
                    }
                ]
            );
        }
    };

    const handleNovaCompra = () => {
        router.push(`/compras/nova?clienteId=${id}`);
    };

    const calcularResumo = () => {
        const total = storage.calcularTotalDevido(compras);
        const pagas = compras.filter(c => c.pago).length;

        return {
            total,
            quantidadeCompras: compras.length,
            quantidadePagas: pagas,
        };
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    if (!cliente) {
        return null;
    }

    const resumo = calcularResumo();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.nomeCliente}>{cliente.nome}</Text>
                {cliente.telefone && (
                    <Text style={styles.telefone}>{cliente.telefone}</Text>
                )}
                <TouchableOpacity
                    onPress={() => router.push(`/clientes/editar/${cliente.id}`)}
                    style={styles.btnEditar}
                >
                    <Text style={{ color: '#007AFF', marginTop: 8 }}>✍️​Editar Cliente</Text>
                </TouchableOpacity>

                {resumo.total > 0 && (
                    <View style={styles.acoesWhatsApp}>
                        <TouchableOpacity
                            style={styles.btnWhatsApp}
                            onPress={handleEnviarCobranca}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnWhatsAppIcon}>💬</Text>
                            <Text style={styles.btnWhatsAppText}>Enviar Cobrança</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btnWhatsApp, styles.btnWhatsAppSecundario]}
                            onPress={handleCompartilharExtrato}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnWhatsAppIcon}>📋</Text>
                            <Text style={styles.btnWhatsAppText}>Compartilhar Extrato</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <FlatList

                data={compras}
                keyExtractor={item => item.id}
                ListHeaderComponent={
                    <TotalDevido
                        total={resumo.total}
                        quantidadeCompras={resumo.quantidadeCompras}
                        quantidadePagas={resumo.quantidadePagas}
                    />

                }

                renderItem={({ item }) => (
                    <CompraItem
                        compra={item}
                        onTogglePago={() => handleTogglePago(item.id)}
                        onDelete={() => handleDeleteCompra(item.id)}
                    />
                )}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>🛒</Text>
                        <Text style={styles.emptyTitle}>Nenhuma compra registrada</Text>
                        <Text style={styles.emptySubtitle}>
                            Toque no botão + para adicionar uma compra
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={handleNovaCompra}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        marginBottom: 60,
    },
    acoesWhatsApp: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    btnWhatsApp: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25D366',
        borderRadius: 8,
        padding: 12,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    btnWhatsAppSecundario: {
        backgroundColor: '#128C7E',
    },
    btnWhatsAppIcon: {
        fontSize: 20,
    },
    btnWhatsAppText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
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
    btnEditar: {
        marginTop: 8,
        padding: 8,
        borderRadius: 4,
    },
    btnVoltar: {
        marginBottom: 12,
    },
    btnVoltarText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '500',
    },
    nomeCliente: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    telefone: {
        fontSize: 16,
        color: '#666',
    },
    lista: {
        paddingBottom: 100,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
    },
});