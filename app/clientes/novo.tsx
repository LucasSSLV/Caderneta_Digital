// app/clientes/novo.tsx
import { useRouter } from 'expo-router';
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
import { useTheme } from '../../contexts/ThemeContext';
import * as storage from '../../services/storage';
import { Cliente } from '../../types';

export default function NovoCliente() {
    const router = useRouter();
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [salvando, setSalvando] = useState(false);
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const formatarTelefone = (text: string) => {
        // Remove tudo que não é número
        const cleaned = text.replace(/\D/g, '');

        // Aplica a máscara (85) 98765-4321
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

        try {
            setSalvando(true);

            const novoCliente: Cliente = {
                id: storage.gerarId(),
                nome: nome.trim(),
                telefone: telefone.trim() || undefined,
                dataCadastro: new Date().toISOString(),
            };

            await storage.adicionarCliente(novoCliente);

            Alert.alert(
                'Sucesso',
                'Cliente cadastrado com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
            setNome('');
            setTelefone('');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível cadastrar o cliente. Tente novamente.');
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

                <Text style={styles.titulo}>Novo Cliente</Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome Completo</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: João Silva"
                            value={nome}
                            onChangeText={setNome}
                            autoFocus
                            autoCapitalize="words"
                            editable={!salvando}
                            placeholderTextColor={colors.textSecondary}
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
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <Text style={styles.dica}>
                        💡 Dica: Adicione o telefone para enviar lembretes de pagamento no futuro
                    </Text>
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
                        <Text style={styles.btnSalvarText}>Salvar Cliente</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

function createStyles(colors: any, isDark: boolean) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            backgroundColor: colors.card,
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
            color: colors.textSecondary,
            marginBottom: 8,
        },
        input: {
            backgroundColor: colors.card,
            borderRadius: 8,
            padding: 16,
            fontSize: 16,
            borderWidth: 1,
            borderColor: colors.border,
            color: colors.text,
        },
        dica: {
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
            fontStyle: 'italic',
        },
        footer: {
            backgroundColor: colors.card,
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        btnSalvar: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            padding: 16,
            alignItems: 'center',
        },
        btnSalvarDisabled: {
            opacity: 0.6,
        },
        btnSalvarText: {
            color: colors.card,
            fontSize: 18,
            fontWeight: '600',
        },
    });
}