// app/compras/nova.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
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
import { Compra } from '../../types';

export default function NovaCompra() {
    const router = useRouter();
    const { clienteId } = useLocalSearchParams<{ clienteId: string }>();

    const [descricao, setDescricao] = useState('');
    const [valor, setValor] = useState('');
    const [salvando, setSalvando] = useState(false);

    const formatarMoeda = (text: string) => {
        // Remove tudo que não é número
        const cleaned = text.replace(/\D/g, '');

        if (!cleaned) return '';

        // Converte para número e divide por 100 para ter os centavos
        const number = parseFloat(cleaned) / 100;

        // Formata como moeda brasileira
        return number.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const handleValorChange = (text: string) => {
        const formatted = formatarMoeda(text);
        setValor(formatted);
    };

    const converterParaNumero = (valorFormatado: string) => {
        // Remove tudo que não é número
        const cleaned = valorFormatado.replace(/\D/g, '');
        return parseFloat(cleaned) / 100;
    };

    const handleSalvar = async () => {
        if (!descricao.trim()) {
            Alert.alert('Atenção', 'Por favor, informe a descrição da compra.');
            return;
        }

        if (!valor || converterParaNumero(valor) <= 0) {
            Alert.alert('Atenção', 'Por favor, informe um valor válido.');
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
                descricao: descricao.trim(),
                valor: converterParaNumero(valor),
                data: new Date().toISOString(),
                pago: false,
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
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Descrição *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Compra de arroz e feijão"
                            value={descricao}
                            onChangeText={setDescricao}
                            autoFocus
                            multiline
                            numberOfLines={2}
                            textAlignVertical="top"
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Valor *</Text>
                        <View style={styles.valorContainer}>
                            <Text style={styles.cifrao}>R$</Text>
                            <TextInput
                                style={styles.inputValor}
                                placeholder="0,00"
                                value={valor}
                                onChangeText={handleValorChange}
                                keyboardType="numeric"
                                editable={!salvando}
                            />
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>ℹ️</Text>
                        <Text style={styles.infoText}>
                            Esta compra será registrada com a data de hoje e ficará pendente de pagamento.
                        </Text>
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
                        <Text style={styles.btnSalvarText}>Registrar Compra</Text>
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
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        minHeight: 60,
    },
    valorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        paddingHorizontal: 16,
    },
    cifrao: {
        fontSize: 20,
        fontWeight: '600',
        color: '#666',
        marginRight: 8,
    },
    inputValor: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: '#1a1a1a',
        padding: 16,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        padding: 16,
        marginTop: 8,
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1565C0',
        lineHeight: 20,
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