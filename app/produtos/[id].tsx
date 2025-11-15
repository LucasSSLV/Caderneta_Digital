// app/produtos/[id].tsx - Editar Produto
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import * as storage from '../../services/storage';
import { Produto } from '../../types';

export default function EditarProduto() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [precoUnidade, setPrecoUnidade] = useState('');
    const [precoCaixa, setPrecoCaixa] = useState('');
    const [pesoUnidade, setPesoUnidade] = useState('');
    const [unidadesPorCaixa, setUnidadesPorCaixa] = useState('');
    const [estoque, setEstoque] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        carregarProduto();
    }, [id]);


    const carregarProduto = async () => {
        if (!id) {
            Alert.alert('Erro', 'Produto não encontrado');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const produto = await storage.buscarProdutoPorId(id);

            if (!produto) {
                Alert.alert('Erro', 'Produto não encontrado');
                router.back();
                return;
            }

            setNome(produto.nome);
            setCategoria(produto.categoria || '');
            setPrecoUnidade(formatarMoedaDisplay(produto.precoUnidade));
            setPrecoCaixa(produto.precoCaixa ? formatarMoedaDisplay(produto.precoCaixa) : '');
            setPesoUnidade(produto.pesoUnidade?.toString() || '');
            setUnidadesPorCaixa(produto.unidadesPorCaixa?.toString() || '');
            setEstoque(produto.estoque?.toString() || '');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar o produto');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatarMoedaDisplay = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatarMoeda = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (!cleaned) return '';
        const number = parseFloat(cleaned) / 100;
        return number.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const converterParaNumero = (valorFormatado: string) => {
        const cleaned = valorFormatado.replace(/\D/g, '');
        return parseFloat(cleaned) / 100;
    };

    const handlePrecoUnidadeChange = (text: string) => {
        const formatted = formatarMoeda(text);
        setPrecoUnidade(formatted);
    };

    const handlePrecoCaixaChange = (text: string) => {
        const formatted = formatarMoeda(text);
        setPrecoCaixa(formatted);
    };


    const limparTodosDados = async () => {
        setNome('');
        setCategoria('');
        setPrecoUnidade('');
        setPrecoCaixa('');
        setPesoUnidade('');
        setUnidadesPorCaixa('');
        setEstoque('');
    };


    const handleSalvar = async () => {
        if (!nome.trim()) {
            Alert.alert('Atenção', 'Por favor, informe o nome do produto.');
            return;
        }

        if (!precoUnidade || converterParaNumero(precoUnidade) <= 0) {
            Alert.alert('Atenção', 'Por favor, informe o preço da unidade.');
            return;
        }

        if (!id) return;

        try {
            setSalvando(true);

            const produtoAtualizado: Produto = {
                id: id,
                nome: nome.trim(),
                categoria: categoria.trim() || undefined,
                precoUnidade: converterParaNumero(precoUnidade),
                precoCaixa: precoCaixa ? converterParaNumero(precoCaixa) : undefined,
                pesoUnidade: pesoUnidade ? parseFloat(pesoUnidade.replace(',', '.')) : undefined,
                unidadesPorCaixa: unidadesPorCaixa ? parseInt(unidadesPorCaixa) : undefined,
                estoque: estoque ? parseInt(estoque) : undefined,
                dataCadastro: new Date().toISOString(), // Manter data original seria melhor
            };

            await storage.atualizarProduto(produtoAtualizado);

            Alert.alert(
                'Sucesso',
                'Produto atualizado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );

            limparTodosDados();

        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o produto. Tente novamente.');
            console.error(error);
        } finally {
            setSalvando(false);
        }
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
                    disabled={salvando}
                >
                    <Text style={styles.btnVoltarText}>← Cancelar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>Editar Produto</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome do Produto *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Arroz 5kg"
                            value={nome}
                            onChangeText={setNome}
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Categoria (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Grãos, Laticínios, Bebidas"
                            value={categoria}
                            onChangeText={setCategoria}
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Preço Unidade *</Text>
                            <View style={styles.valorContainer}>
                                <Text style={styles.cifrao}>R$</Text>
                                <TextInput
                                    style={styles.inputValor}
                                    placeholder="0,00"
                                    value={precoUnidade}
                                    onChangeText={handlePrecoUnidadeChange}
                                    keyboardType="numeric"
                                    editable={!salvando}
                                />
                            </View>
                        </View>

                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Preço Caixa</Text>
                            <View style={styles.valorContainer}>
                                <Text style={styles.cifrao}>R$</Text>
                                <TextInput
                                    style={styles.inputValor}
                                    placeholder="0,00"
                                    value={precoCaixa}
                                    onChangeText={handlePrecoCaixaChange}
                                    keyboardType="numeric"
                                    editable={!salvando}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Peso Unidade (kg)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: 5"
                                value={pesoUnidade}
                                onChangeText={setPesoUnidade}
                                keyboardType="decimal-pad"
                                editable={!salvando}
                            />
                        </View>

                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.label}>Unid. por Caixa</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: 12"
                                value={unidadesPorCaixa}
                                onChangeText={setUnidadesPorCaixa}
                                keyboardType="number-pad"
                                editable={!salvando}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Estoque Atual (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Quantidade em estoque ex: 50"
                            value={estoque}
                            onChangeText={setEstoque}
                            keyboardType="number-pad"
                            editable={!salvando}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.btnSalvar, salvando && styles.btnSalvarDisabled]}
                    onPress={handleSalvar}
                    activeOpacity={0.8}
                    disabled={salvando}
                >
                    {salvando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnSalvarText}>Salvar Alterações</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#d51313ff',
        marginBottom: 60,
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
    },
    content: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfWidth: {
        flex: 1,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        fontSize: 16,
        color: '#1a1a1a',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        fontWeight: '700',
    },
    valorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 12,
    },
    cifrao: {
        fontSize: 16,
        fontWeight: '600',
        color: '#088d3fff',
        marginRight: 6,
    },
    inputValor: {
        flex: 1,
        fontSize: 18,
        fontWeight: '600',
        color: '#f70505ff',
        padding: 14,

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