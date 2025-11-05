// components/ClienteCard.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cliente } from '../types';

interface ClienteCardProps {
    cliente: Cliente;
    totalDevido: number;
    onPress: () => void;
    onLongPress?: () => void;
}

export default function ClienteCard({
    cliente,
    totalDevido,
    onPress,
    onLongPress
}: ClienteCardProps) {

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            onLongPress={onLongPress}
            activeOpacity={0.7}
        >
            <View style={styles.header}>
                <Text style={styles.nome}>{cliente.nome}</Text>
                {cliente.telefone && (
                    <Text style={styles.telefone}>{cliente.telefone}</Text>
                )}
            </View>

            <View style={styles.footer}>
                <Text style={styles.label}>Total devido:</Text>
                <Text style={[
                    styles.valor,
                    totalDevido > 0 ? styles.valorDevido : styles.valorZero
                ]}>
                    {formatarValor(totalDevido)}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        marginBottom: 12,
    },
    nome: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    telefone: {
        fontSize: 14,
        color: '#666',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    valor: {
        fontSize: 18,
        fontWeight: '700',
    },
    valorDevido: {
        color: '#e74c3c',
    },
    valorZero: {
        color: '#27ae60',
    },
});