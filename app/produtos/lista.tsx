// app/produtos/lista.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as storage from '../../services/storage';
import { Produto } from '../../types';

export default function ListaProdutos() {
    const router = useRouter();
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [loading, setLoading] = useState(true);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const produtosData = await storage.carregarProdutos();
            setProdutos(produtosData);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar os produtos.');
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

    const handleProdutoPress = (produtoId: string) => {
        router.push(`/produtos/${produtoId}`);
        console.log('Produto:', produtoId);
    };

    const handleProdutoLongPress = (produto: Produto) => {
        Alert.alert(
            'Excluir Produto',
            `Deseja excluir ${produto.nome}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await storage.excluirProduto(produto.id);
                            await carregarDados();
                            Alert.alert('Sucesso', 'Produto excluído com sucesso!');
                        } catch (error) {
                            Alert.alert('Erro', 'Não foi possível excluir o produto.');
                        }
                    }
                }
            ]
        );
    };

    const handleNovoProduto = () => {
        router.push('/produtos/novo');
    };

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const renderProdutoCard = ({ item }: { item: Produto }) => (
        <TouchableOpacity
            style={styles.produtoCard}
            onPress={() => handleProdutoPress(item.id)}
            onLongPress={() => handleProdutoLongPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.nomeProduto}>{item.nome}</Text>
                {item.categoria && (
                    <View style={styles.categoriaTag}>
                        <Text style={styles.categoriaText}>{item.categoria}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardBody}>
                <View style={styles.precoContainer}>
                    <Text style={styles.precoLabel}>Unidade</Text>
                    <Text style={styles.precoValor}>{formatarValor(item.precoUnidade)}</Text>
                </View>

                {item.precoCaixa && (
                    <View style={styles.precoContainer}>
                        <Text style={styles.precoLabel}>Caixa</Text>
                        <Text style={styles.precoValor}>{formatarValor(item.precoCaixa)}</Text>
                    </View>
                )}
            </View>

            <View style={styles.cardFooter}>
                {item.unidadesPorCaixa && (
                    <Text style={styles.infoText}>📦 {item.unidadesPorCaixa} und/cx</Text>
                )}
                {item.pesoUnidade && (
                    <Text style={styles.infoText}>⚖️ {item.pesoUnidade}kg</Text>
                )}
                {item.estoque !== undefined && (
                    <Text style={styles.infoText}>📊 Estoque: {item.estoque}</Text>
                )}
            </View>
        </TouchableOpacity>
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

                <Text style={styles.titulo}>Produtos</Text>
                <Text style={styles.subtitulo}>
                    {produtos.length} {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
                </Text>
            </View>

            <FlatList
                data={produtos}
                keyExtractor={item => item.id}
                renderItem={renderProdutoCard}
                contentContainerStyle={styles.lista}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>📦</Text>
                        <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
                        <Text style={styles.emptySubtitle}>
                            Toque no botão + para adicionar seu primeiro produto
                        </Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={handleNovoProduto}
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
    produtoCard: {
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
        alignItems: 'center',
        marginBottom: 12,
    },
    nomeProduto: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        flex: 1,
    },
    categoriaTag: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    categoriaText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1565C0',
    },
    cardBody: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    precoContainer: {
        flex: 1,
    },
    precoLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    precoValor: {
        fontSize: 18,
        fontWeight: '700',
        color: '#27ae60',
    },
    cardFooter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    infoText: {
        fontSize: 13,
        color: '#666',
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