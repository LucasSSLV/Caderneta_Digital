// app/compras/nova.tsx - VERSÃO ATUALIZADA
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as storage from '../../services/storage';
import { Compra, ItemCompra, Produto } from '../../types';

export default function NovaCompra() {
    const router = useRouter();
    const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [itensCarrinho, setItensCarrinho] = useState<ItemCompra[]>([]);
    const [observacao, setObservacao] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
    const [quantidade, setQuantidade] = useState('1');
    const [tipoVenda, setTipoVenda] = useState<'unidade' | 'caixa'>('unidade');

    useEffect(() => {
        carregarProdutos();
    }, []);

    const carregarProdutos = async () => {
        const produtosData = await storage.carregarProdutos();
        setProdutos(produtosData);
    };

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const calcularSubtotal = () => {
        if (!produtoSelecionado || !quantidade) return 0;

        const qtd = parseInt(quantidade) || 0;
        const preco = tipoVenda === 'unidade'
            ? produtoSelecionado.precoUnidade
            : (produtoSelecionado.precoCaixa || produtoSelecionado.precoUnidade);

        return qtd * preco;
    };

    const calcularTotal = () => {
        return itensCarrinho.reduce((sum, item) => sum + item.subtotal, 0);
    };

    const handleSelecionarProduto = (produto: Produto) => {
        setProdutoSelecionado(produto);
        setQuantidade('1');
        setTipoVenda('unidade');
        setModalVisible(true);
    };

    const handleAdicionarItem = () => {
        if (!produtoSelecionado || !quantidade || parseInt(quantidade) <= 0) {
            Alert.alert('Atenção', 'Informe uma quantidade válida.');
            return;
        }

        const preco = tipoVenda === 'unidade'
            ? produtoSelecionado.precoUnidade
            : (produtoSelecionado.precoCaixa || produtoSelecionado.precoUnidade);

        const novoItem: ItemCompra = {
            produtoId: produtoSelecionado.id,
            nomeProduto: produtoSelecionado.nome,
            quantidade: parseInt(quantidade),
            tipo: tipoVenda,
            precoUnitario: preco,
            subtotal: calcularSubtotal(),
        };

        setItensCarrinho([...itensCarrinho, novoItem]);
        setModalVisible(false);
        setProdutoSelecionado(null);
    };

    const handleRemoverItem = (index: number) => {
        const novosItens = [...itensCarrinho];
        novosItens.splice(index, 1);
        setItensCarrinho(novosItens);
    };

    const limparCampos = () => {
        setItensCarrinho([]);
        setObservacao('');
    };

    const handleSalvar = async () => {
        if (itensCarrinho.length === 0) {
            Alert.alert('Atenção', 'Adicione pelo menos um produto.');
            return;
        }

        if (!clienteId) {
            Alert.alert('Erro', 'Cliente não identificado.');
            return;
        }

        try {
            setSalvando(true);

            const novaCompra: Compra = {
                id: storage.gerarId(),
                clienteId: clienteId,
                itens: itensCarrinho,
                valorTotal: calcularTotal(),
                data: new Date().toISOString(),
                pago: false,
                observacao: observacao.trim() || undefined,
            };

            await storage.adicionarCompra(novaCompra);

            Alert.alert(
                'Sucesso',
                'Compra registrada com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
            limparCampos();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível registrar a compra. Tente novamente.');
            console.error(error);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                    disabled={salvando}
                >
                    <Text style={styles.btnVoltarText}>← Cancelar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>Nova Compra</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                {/* Lista de Produtos para Adicionar */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Selecione os Produtos</Text>
                    <FlatList
                        data={produtos}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.produtoChip}
                                onPress={() => handleSelecionarProduto(item)}
                            >
                                <Text style={styles.produtoChipText}>{item.nome}</Text>
                                <Text style={styles.produtoChipPreco}>{formatarValor(item.precoUnidade)}</Text>
                            </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyProdutos}>
                                <Text style={styles.emptyText}>Nenhum produto cadastrado</Text>
                                <TouchableOpacity onPress={() => router.push('/produtos/novo')}>
                                    <Text style={styles.linkText}>Cadastrar Produto</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                </View>

                {/* Carrinho */}
                {itensCarrinho.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Itens da Compra</Text>
                        {itensCarrinho.map((item, index) => (
                            <View key={index} style={styles.itemCard}>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemNome}>{item.nomeProduto}</Text>
                                    <Text style={styles.itemDetalhes}>
                                        {item.quantidade} {item.tipo === 'unidade' ? 'und' : 'cx'} × {formatarValor(item.precoUnitario)}
                                    </Text>
                                </View>
                                <View style={styles.itemActions}>
                                    <Text style={styles.itemSubtotal}>{formatarValor(item.subtotal)}</Text>
                                    <TouchableOpacity onPress={() => handleRemoverItem(index)}>
                                        <Text style={styles.btnRemover}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}

                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Total</Text>
                            <Text style={styles.totalValor}>{formatarValor(calcularTotal())}</Text>
                        </View>
                    </View>
                )}

                {/* Observação */}
                <View style={styles.section}>
                    <Text style={styles.label}>Observação (opcional)</Text>
                    <TextInput
                        style={styles.inputObservacao}
                        placeholder="Ex: Entrega para amanhã"
                        value={observacao}
                        onChangeText={setObservacao}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        editable={!salvando}
                    />
                </View>
            </ScrollView>

            {/* Modal de Adicionar Item */}
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

                        <View style={styles.tipoVendaContainer}>
                            <TouchableOpacity
                                style={[styles.tipoBtn, tipoVenda === 'unidade' && styles.tipoBtnActive]}
                                onPress={() => setTipoVenda('unidade')}
                            >
                                <Text style={[styles.tipoBtnText, tipoVenda === 'unidade' && styles.tipoBtnTextActive]}>
                                    Unidade
                                </Text>
                                <Text style={[styles.tipoBtnPreco, tipoVenda === 'unidade' && styles.tipoBtnTextActive]}>
                                    {produtoSelecionado && formatarValor(produtoSelecionado.precoUnidade)}
                                </Text>
                            </TouchableOpacity>

                            {produtoSelecionado?.precoCaixa && (
                                <TouchableOpacity
                                    style={[styles.tipoBtn, tipoVenda === 'caixa' && styles.tipoBtnActive]}
                                    onPress={() => setTipoVenda('caixa')}
                                >
                                    <Text style={[styles.tipoBtnText, tipoVenda === 'caixa' && styles.tipoBtnTextActive]}>
                                        Caixa
                                    </Text>
                                    <Text style={[styles.tipoBtnPreco, tipoVenda === 'caixa' && styles.tipoBtnTextActive]}>
                                        {formatarValor(produtoSelecionado.precoCaixa)}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.quantidadeContainer}>
                            <Text style={styles.label}>Quantidade</Text>
                            <TextInput
                                style={styles.inputQuantidade}
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="number-pad"
                                autoFocus
                            />
                        </View>

                        <View style={styles.subtotalContainer}>
                            <Text style={styles.subtotalLabel}>Subtotal</Text>
                            <Text style={styles.subtotalValor}>{formatarValor(calcularSubtotal())}</Text>
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.btnModalCancelar}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.btnModalCancelarText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.btnModalAdicionar}
                                onPress={handleAdicionarItem}
                            >
                                <Text style={styles.btnModalAdicionarText}>Adicionar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btnSalvar, (salvando || itensCarrinho.length === 0) && styles.btnSalvarDisabled]}
                    onPress={handleSalvar}
                    activeOpacity={0.8}
                    disabled={salvando || itensCarrinho.length === 0}
                >
                    {salvando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnSalvarText}>
                            Registrar Compra {itensCarrinho.length > 0 && `• ${formatarValor(calcularTotal())}`}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        marginBottom: 60,
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
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    produtoChip: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        minWidth: 140,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    produtoChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    produtoChipPreco: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27ae60',
    },
    emptyProdutos: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    linkText: {
        fontSize: 14,
        color: '#007AFF',
        fontWeight: '600',
    },
    itemCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemNome: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    itemDetalhes: {
        fontSize: 13,
        color: '#666',
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    itemSubtotal: {
        fontSize: 16,
        fontWeight: '700',
        color: '#27ae60',
    },
    btnRemover: {
        fontSize: 18,
    },
    totalCard: {
        backgroundColor: '#E8F5E9',
        borderRadius: 8,
        padding: 16,
        marginTop: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    totalValor: {
        fontSize: 24,
        fontWeight: '700',
        color: '#27ae60',
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    inputObservacao: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minHeight: 80,
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
    tipoVendaContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    tipoBtn: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    tipoBtnActive: {
        backgroundColor: '#E3F2FD',
        borderColor: '#007AFF',
    },
    tipoBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    tipoBtnTextActive: {
        color: '#007AFF',
    },
    tipoBtnPreco: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    quantidadeContainer: {
        marginBottom: 20,
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
    subtotalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        marginBottom: 20,
    },
    subtotalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    subtotalValor: {
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
    btnModalAdicionar: {
        flex: 1,
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    btnModalAdicionarText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    btnSalvar: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    btnSalvarDisabled: {
        opacity: 0.6,
    },
    btnSalvarText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});