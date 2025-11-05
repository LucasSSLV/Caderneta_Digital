// app/clientes/lista.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ClienteCard from '../../components/ClientCard';
import * as storage from '../../services/storage';
import { Cliente, Compra } from '../../types';

export default function ListaClientes() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [clientesData, comprasData] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
            ]);
            setClientes(clientesData);
            setCompras(comprasData);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os dados.');
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

    const handleClienteLongPress = (cliente: Cliente) => {
        Alert.alert(
            'Excluir Cliente',
            `Deseja excluir ${cliente.nome}?\n\nTodas as compras deste cliente também serão excluídas.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await storage.excluirCliente(cliente.id);
                            await carregarDados();
                            Alert.alert('Sucesso', 'Cliente excluído com sucesso!');
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o cliente.');
                        }
                    }
                }
            ]
        );
    };

    const handleNovoCliente = () => {
        router.push('/clientes/novo');
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

                <Text style={styles.titulo}>Todos os Clientes</Text>
                <Text style={styles.subtitulo}>
                    {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
                </Text>
            </View>

            <FlatList
                data={clientes}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ClienteCard
                        cliente={item}
                        totalDevido={calcularTotalDevido(item.id)}
                        onPress={() => handleClientePress(item.id)}
                        onLongPress={() => handleClienteLongPress(item)}
                    />
                )}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>👥</Text>
                        <Text style={styles.emptyTitle}>Nenhum cliente cadastrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Toque no botão + para adicionar seu primeiro cliente
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={handleNovoCliente}
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