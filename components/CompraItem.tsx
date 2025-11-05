// components/CompraItem.tsx - ATUALIZADO
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Compra } from '../types';

interface CompraItemProps {
    compra: Compra;
    onTogglePago: () => void;
    onDelete: () => void;
}

export default function CompraItem({
    compra,
    onTogglePago,
    onDelete
}: CompraItemProps) {

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

    const getDescricao = () => {
        if (compra.itens && compra.itens.length > 0) {
            // Nova estrutura com itens
            const quantidadeItens = compra.itens.length;
            const primeiroItem = compra.itens[0];

            if (quantidadeItens === 1) {
                return `${primeiroItem.quantidade} ${primeiroItem.tipo === 'unidade' ? 'und' : 'cx'} - ${primeiroItem.nomeProduto}`;
            } else {
                return `${quantidadeItens} produtos: ${primeiroItem.nomeProduto}${quantidadeItens > 1 ? '...' : ''}`;
            }
        }
        // Fallback para estrutura antiga
        return compra.observacao || 'Compra sem descrição';
    };

    return (
        <View style={[
            styles.container,
            compra.pago && styles.containerPago
        ]}>
            <TouchableOpacity
                style={styles.conteudo}
                onPress={onTogglePago}
                activeOpacity={0.7}
            >
                <View style={styles.info}>
                    <Text style={[
                        styles.descricao,
                        compra.pago && styles.textoPago
                    ]}>
                        {getDescricao()}
                    </Text>
                    <Text style={styles.data}>{formatarData(compra.data)}</Text>
                    {compra.observacao && (
                        <Text style={styles.observacao}>{compra.observacao}</Text>
                    )}
                </View>

                <View style={styles.direita}>
                    <Text style={[
                        styles.valor,
                        compra.pago && styles.textoPago
                    ]}>
                        {formatarValor(compra.valorTotal)}
                    </Text>
                    {compra.pago && (
                        <Text style={styles.badge}>✓ Pago</Text>
                    )}
                </View>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.btnDelete}
                onPress={onDelete}
                activeOpacity={0.7}
            >
                <Text style={styles.deleteText}>🗑️</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    containerPago: {
        backgroundColor: '#f8f9fa',
        opacity: 0.8,
    },
    conteudo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    info: {
        flex: 1,
    },
    descricao: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    data: {
        fontSize: 12,
        color: '#999',
    },
    observacao: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    direita: {
        alignItems: 'flex-end',
    },
    valor: {
        fontSize: 16,
        fontWeight: '700',
        color: '#e74c3c',
        marginBottom: 4,
    },
    badge: {
        fontSize: 11,
        color: '#27ae60',
        fontWeight: '600',
    },
    textoPago: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    btnDelete: {
        padding: 14,
        paddingLeft: 8,
    },
    deleteText: {
        fontSize: 18,
    },
});