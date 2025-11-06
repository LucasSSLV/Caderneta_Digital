// components/TotalDevido.tsx
import { StyleSheet, Text, View } from 'react-native';

interface TotalDevidoProps {
    total: number;
    quantidadeCompras: number;
    quantidadePagas: number;
}

export default function TotalDevido({
    total,
    quantidadeCompras,
    quantidadePagas
}: TotalDevidoProps) {

    const formatarValor = (valor: number) => {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const comprasPendentes = quantidadeCompras - quantidadePagas;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.titulo}>Resumo da Conta</Text>
            </View>

            <View style={styles.linha}>
                <Text style={styles.label}>Total de compras:</Text>
                <Text style={styles.valor}>{quantidadeCompras}</Text>
            </View>

            <View style={styles.linha}>
                <Text style={styles.label}>Pagas:</Text>
                <Text style={[styles.valor, styles.valorPago]}>{quantidadePagas}</Text>
            </View>

            <View style={styles.linha}>
                <Text style={styles.label}>Pendentes:</Text>
                <Text style={[styles.valor, styles.valorPendente]}>
                    {comprasPendentes}
                </Text>
            </View>

            <View style={styles.divisor} />

            <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Devido:</Text>
                <Text style={[
                    styles.totalValor,
                    total > 0 ? styles.totalDevido : styles.totalZero
                ]}>
                    {formatarValor(total)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        marginBottom: 16,
    },
    titulo: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    linha: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    label: {
        fontSize: 15,
        color: '#666',
    },
    valor: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    valorPago: {
        color: '#27ae60',
    },
    valorPendente: {
        color: '#e74c3c',
    },
    divisor: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 12,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    totalValor: {
        fontSize: 24,
        fontWeight: '700',
    },
    totalDevido: {
        color: '#e74c3c',
    },
    totalZero: {
        color: '#27ae60',
    },
});