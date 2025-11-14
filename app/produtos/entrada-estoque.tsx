// app/produtos/entrada-estoque.tsx - Entrada de Estoque
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as storage from '../../services/storage';
import { Produto } from '../../types';

export default function EntradaEstoque() {
    const router = useRouter();
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Modal
    const [modalVisible, setModalVisible] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
    const [quantidade, setQuantidade] = useState('');
    const [salvando, setSalvando] = useState(false);

    const carregarProdutos = async () => {
        try {
            setLoading(true);
            const produtosData = await storage.carregarProdutos();
            setProdutos(produtosData);
            setProdutosFiltrados(produtosData);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os produtos.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            carregarProdutos();
        }, [])
    );

    const handleBusca = (texto: string) => {
        setBusca(texto);

        if (!texto.trim()) {
            setProdutosFiltrados(produtos);
            return;
        }

        const textoLower = texto.toLowerCase();
        const filtrados = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(textoLower) ||
            produto.categoria?.toLowerCase().includes(textoLower)
        );

        setProdutosFiltrados(filtrados);
    };

    const handleSelecionarProduto = (produto: Produto) => {
        setProdutoSelecionado(produto);
        setQuantidade('');
        setModalVisible(true);
    };

    const handleConfirmarEntrada = async () => {
        if (!produtoSelecionado || !quantidade || parseInt(quantidade) <= 0) {
            Alert.alert('Atenção', 'Informe uma quantidade válida.');
            return;
        }

        try {
            setSalvando(true);

            await storage.adicionarEntradaEstoque(
                produtoSelecionado.id,
                parseInt(quantidade),
                'Entrada manual de estoque'
            );

            // Fecha o modal primeiro
            setModalVisible(false);
            setProdutoSelecionado(null);
            setQuantidade('');

            // Recarrega os dados
            await carregarProdutos();

            // Mostra o alerta de sucesso
            Alert.alert(
                'Sucesso',
                `${quantidade} unidades adicionadas ao estoque de ${produtoSelecionado.nome}!`
            );
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar a entrada de estoque.');
            console.error(error);
        } finally {
            setSalvando(false);
        }
    };

    const getEstoqueStatus = (produto: Produto) => {
        if (produto.estoque === undefined) return 'sem-controle';
        const minimo = produto.estoqueMinimo || 5;
        if (produto.estoque === 0) return 'zerado';
        if (produto.estoque <= minimo) return 'baixo';
        return 'ok';
    };

    const renderProduto = ({ item }: { item: Produto }) => {
        const status = getEstoqueStatus(item);

        return (
            <TouchableOpacity
                style={styles.produtoCard}
                onPress={() => handleSelecionarProduto(item)}
                activeOpacity={0.7}
            >
                <View style={styles.produtoInfo}>
                    <Text style={styles.produtoNome}>{item.nome}</Text>
                    {item.categoria && (
                        <Text style={styles.produtoCategoria}>{item.categoria}</Text>
                    )}
                </View>

                <View style={styles.produtoEstoque}>
                    {status === 'zerado' && (
                        <View style={styles.badgeZerado}>
                            <Text style={styles.badgeText}>🚫 Zerado</Text>
                        </View>
                    )}
                    {status === 'baixo' && (
                        <View style={styles.badgeBaixo}>
                            <Text style={styles.badgeText}>⚠️ Baixo</Text>
                        </View>
                    )}
                    {item.estoque !== undefined ? (
                        <Text style={[
                            styles.estoqueValor,
                            status === 'zerado' && { color: '#e74c3c' },
                            status === 'baixo' && { color: '#f39c12' },
                            status === 'ok' && { color: '#27ae60' }
                        ]}>
                            {item.estoque} und
                        </Text>
                    ) : (
                        <Text style={styles.semEstoque}>Sem controle</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>📦 Entrada de Estoque</Text>
                <Text style={styles.subtitulo}>Selecione o produto para adicionar estoque</Text>
            </View>

            {/* Barra de Busca */}
            <View style={styles.buscaContainer}>
                <View style={styles.buscaInputContainer}>
                    <Text style={styles.buscaIcon}>🔍</Text>
                    <TextInput
                        style={styles.buscaInput}
                        placeholder="Buscar produto..."
                        value={busca}
                        onChangeText={handleBusca}
                        placeholderTextColor="#999"
                    />
                    {busca.length > 0 && (
                        <TouchableOpacity
                            onPress={() => {
                                setBusca('');
                                setProdutosFiltrados(produtos);
                            }}
                            style={styles.btnLimpar}
                        >
                            <Text style={styles.btnLimparText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <FlatList
                data={produtosFiltrados}
                keyExtractor={item => item.id}
                renderItem={renderProduto}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>
                            {busca ? '🔍' : '📦'}
                        </Text>
                        <Text style={styles.emptyTitle}>
                            {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </Text>
                        <Text style={styles.emptySubtitle}>
                            {busca
                                ? 'Tente buscar por outro nome'
                                : 'Cadastre produtos para controlar o estoque'
                            }
                        </Text>
                    </View>
                }
            />

            {/* Modal de Entrada */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {produtoSelecionado?.nome}
                        </Text>

                        {produtoSelecionado?.estoque !== undefined && (
                            <View style={styles.estoqueAtualCard}>
                                <Text style={styles.estoqueAtualLabel}>Estoque Atual</Text>
                                <Text style={styles.estoqueAtualValor}>
                                    {produtoSelecionado.estoque} unidades
                                </Text>
                            </View>
                        )}

                        <View style={styles.quantidadeContainer}>
                            <Text style={styles.label}>Quantidade a Adicionar</Text>
                            <TextInput
                                style={styles.inputQuantidade}
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor="#999"
                                autoFocus
                            />
                        </View>

                        {quantidade && parseInt(quantidade) > 0 && produtoSelecionado?.estoque !== undefined && (
                            <View style={styles.novoEstoqueCard}>
                                <Text style={styles.novoEstoqueLabel}>Novo Estoque</Text>
                                <Text style={styles.novoEstoqueValor}>
                                    {produtoSelecionado.estoque + parseInt(quantidade)} unidades
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.btnModalCancelar}
                                onPress={() => setModalVisible(false)}
                                disabled={salvando}
                            >
                                <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.btnModalConfirmar,
                                    salvando && styles.btnModalConfirmarDisabled
                                ]}
                                onPress={handleConfirmarEntrada}
                                disabled={salvando}
                            >
                                {salvando ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.btnModalConfirmarText}>Confirmar</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
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
    buscaContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    buscaInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
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
        color: '#1a1a1a',
    },
    btnLimpar: {
        padding: 4,
    },
    btnLimparText: {
        fontSize: 18,
        color: '#999',
    },
    lista: {
        paddingVertical: 8,
    },
    produtoCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    produtoInfo: {
        flex: 1,
    },
    produtoNome: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    produtoCategoria: {
        fontSize: 13,
        color: '#666',
    },
    produtoEstoque: {
        alignItems: 'flex-end',
        gap: 4,
    },
    badgeZerado: {
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeBaixo: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
    },
    estoqueValor: {
        fontSize: 16,
        fontWeight: '700',
    },
    semEstoque: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 20,
        textAlign: 'center',
    },
    estoqueAtualCard: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    estoqueAtualLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    estoqueAtualValor: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    quantidadeContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    inputQuantidade: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    novoEstoqueCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    novoEstoqueLabel: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
    },
    novoEstoqueValor: {
        fontSize: 24,
        fontWeight: '700',
        color: '#27ae60',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    btnModalCancelar: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    btnModalCancelarText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    btnModalConfirmar: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    btnModalConfirmarDisabled: {
        opacity: 0.6,
    },
    btnModalConfirmarText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});