// app/clientes/editar/[id].tsx - Editar Cliente
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
import * as storage from '../../../services/storage';
import { Cliente } from '../../../types';

export default function EditarCliente() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        carregarCliente();
    }, [id]);

    const carregarCliente = async () => {
        if (!id) {
            Alert.alert('Erro', 'Cliente não encontrado');
            router.back();
            return;
        }

        try {
            setLoading(true);
            const cliente = await storage.buscarClientePorId(id);

            if (!cliente) {
                Alert.alert('Erro', 'Cliente não encontrado');
                router.back();
                return;
            }

            setNome(cliente.nome);
            setTelefone(cliente.telefone || '');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível carregar o cliente');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    const limparBusca = () => {
        setNome('');
        setTelefone('');
    };

    const formatarTelefone = (text: string) => {
        const cleaned = text.replace(/\D/g, '');

        if (cleaned.length <= 2) {
            return cleaned;
        } else if (cleaned.length <= 7) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
        } else if (cleaned.length <= 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        }
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
    };

    const handleTelefoneChange = (text: string) => {
        const formatted = formatarTelefone(text);
        setTelefone(formatted);
    };

    const handleSalvar = async () => {
        if (!nome.trim()) {
            Alert.alert('Atenção', 'Por favor, informe o nome do cliente.');
            return;
        }

        if (!id) return;

        try {
            setSalvando(true);

            const clienteAtualizado: Cliente = {
                id: id,
                nome: nome.trim(),
                telefone: telefone.trim() || undefined,
                dataCadastro: new Date().toISOString(),
            };

            await storage.atualizarCliente(clienteAtualizado);

            Alert.alert(
                'Sucesso',
                'Cliente atualizado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
            limparBusca();
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o cliente. Tente novamente.');
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
            
                <Text style={styles.titulo}>Editar Cliente</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: João Silva"
                            value={nome}
                            onChangeText={setNome}
                            autoCapitalize="words"
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telefone (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="(85) 99999-9999"
                            value={telefone}
                            onChangeText={handleTelefoneChange}
                            keyboardType="phone-pad"
                            maxLength={15}
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