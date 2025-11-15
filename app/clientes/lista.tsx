// app/clientes/lista.tsx - COM BUSCA
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ClienteCard from '../../components/ClienteCard';
import { useTheme } from '../../contexts/ThemeContext';
import * as storage from '../../services/storage';
import { Cliente, Compra } from '../../types';

export default function ListaClientes() {
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    const carregarDados = async () => {
        try {
            setLoading(true);
            const [clientesData, comprasData] = await Promise.all([
                storage.carregarClientes(),
                storage.carregarCompras(),
            ]);
            setClientes(clientesData);
            setClientesFiltrados(clientesData);
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

    const handleBusca = (texto: string) => {
        setBusca(texto);

        if (!texto.trim()) {
            setClientesFiltrados(clientes);
            return;
        }

        const textoLower = texto.toLowerCase();
        const filtrados = clientes.filter(cliente =>
            cliente.nome.toLowerCase().includes(textoLower) ||
            cliente.telefone?.toLowerCase().includes(textoLower)
        );

        setClientesFiltrados(filtrados);
    };

    const limparBusca = () => {
        setBusca('');
        setClientesFiltrados(clientes);
    };

    const calcularTotalDevido = (clienteId: string) => {
        const comprasCliente = compras.filter(c => c.clienteId === clienteId);
        return storage.calcularTotalDevido(comprasCliente);
    };

    const handleClientePress = (clienteId: string) => {
        router.push(`/clientes/${clienteId}`);
    };

    const handleClienteLongPress = (cliente: Cliente) => {
        Alert.alert(
            cliente.nome,
            'O que você deseja fazer?',
            [
                {
                    text: 'Editar',
                    onPress: () => router.push(`/clientes/editar/${cliente.id}`),
                },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: () => confirmarExclusao(cliente),
                },
                { text: 'Cancelar', style: 'cancel' },
            ],
            { cancelable: true }
        );
    };

    const confirmarExclusao = (cliente: Cliente) => {
        Alert.alert(
            'Confirmar Exclusão',
            `Tem certeza que deseja excluir ${cliente.nome}?\n\nTodas as compras associadas também serão removidas. Esta ação não pode ser desfeita.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir Definitivamente',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await storage.excluirCliente(cliente.id);
                            // Atualiza o estado localmente para uma resposta mais rápida da UI
                            setClientes(prev => prev.filter(c => c.id !== cliente.id));
                            setClientesFiltrados(prev => prev.filter(c => c.id !== cliente.id));
                            Alert.alert('Sucesso', `${cliente.nome} foi excluído.`);
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o cliente.');
                            // Se der erro, recarrega os dados para garantir consistência
                            carregarDados();
                        }
                    },
                },
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
                    {clientesFiltrados.length} {clientesFiltrados.length === 1 ? 'cliente' : 'clientes'}
                    {busca ? ' encontrado(s)' : ' cadastrado(s)'}
                </Text>
            </View>

            {/* Barra de Busca */}
            <View style={styles.buscaContainer}>
                <View style={styles.buscaInputContainer}>
                    <Text style={styles.buscaIcon}>🔍</Text>
                    <TextInput
                        style={styles.buscaInput}
                        placeholder="Buscar por nome ou telefone..."
                        value={busca}
                        onChangeText={handleBusca}
                        placeholderTextColor="#999"
                    />
                    {busca.length > 0 && (
                        <TouchableOpacity onPress={limparBusca} style={styles.btnLimpar}>
                            <Text style={styles.btnLimparText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={clientesFiltrados}
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
                        <Text style={styles.emptyText}>
                            {busca ? '🔍' : '👥'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {busca
                                ? 'Tente buscar por outro nome ou telefone'
                                : 'Toque no botão + para adicionar seu primeiro cliente'
                            }
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
            color: colors.loadingText,
        },
        header: {
            backgroundColor: colors.background,
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
        buscaContainer: {
            backgroundColor: colors.background,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        buscaInputContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.background,
            borderRadius: 10,
            paddingHorizontal: 12,
        },
        buscaIcon: {
            fontSize: 18,
            marginRight: 8,
        },
        buscaInput: {
            flex: 1,
            paddingVertical: 12,
            fontSize: 16,
            color: colors.text,
        },
        btnLimpar: {
            padding: 4,
        },
        btnLimparText: {
            fontSize: 18,
            color: colors.textSecondary,
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
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
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
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8,
        },
        fabText: {
            fontSize: 32,
            color: colors.background,
            fontWeight: '300',
        },
    });
}