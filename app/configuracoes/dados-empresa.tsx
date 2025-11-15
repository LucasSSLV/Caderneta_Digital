// app/configuracoes/dados-empresa.tsx - Configurar Dados da Empresa
import { useRouter } from 'expo-router';
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
import { useTheme } from '../../contexts/ThemeContext';
import * as receiptService from '../../services/receipt';

export default function DadosEmpresa() {
    const router = useRouter();
    const { colors, isDark } = useTheme();

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [cidade, setCidade] = useState('');

    const styles = createStyles(colors, isDark);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const dados = await receiptService.carregarDadosEmpresa();

            setNome(dados.nome);
            setCnpj(dados.cnpj || '');
            setTelefone(dados.telefone || '');
            setEndereco(dados.endereco || '');
            setCidade(dados.cidade || '');
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatarCNPJ = (text: string) => {
        const cleaned = text.replace(/\D/g, '');

        if (cleaned.length <= 2) {
            return cleaned;
        } else if (cleaned.length <= 5) {
            return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
        } else if (cleaned.length <= 8) {
            return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
        } else if (cleaned.length <= 12) {
            return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
        }
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
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

    const handleCNPJChange = (text: string) => {
        const formatted = formatarCNPJ(text);
        setCnpj(formatted);
    };

    const handleTelefoneChange = (text: string) => {
        const formatted = formatarTelefone(text);
        setTelefone(formatted);
    };

    const handleSalvar = async () => {
        if (!nome.trim()) {
            Alert.alert('Atenção', 'Por favor, informe o nome da empresa.');
            return;
        }

        try {
            setSalvando(true);

            const dados: receiptService.DadosEmpresa = {
                nome: nome.trim(),
                cnpj: cnpj.trim() || undefined,
                telefone: telefone.trim() || undefined,
                endereco: endereco.trim() || undefined,
                cidade: cidade.trim() || undefined,
            };

            await receiptService.salvarDadosEmpresa(dados);

            Alert.alert(
                'Sucesso',
                'Dados da empresa salvos com sucesso!',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
            console.error(error);
        } finally {
            setSalvando(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
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
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>🏢 Dados da Empresa</Text>
                <Text style={styles.subtitulo}>
                    Essas informações aparecerão nos recibos
                </Text>
            </View>

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome da Empresa *</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Minha Empresa Ltda"
                            placeholderTextColor={colors.textSecondary}
                            value={nome}
                            onChangeText={setNome}
                            autoCapitalize="words"
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>CNPJ (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="00.000.000/0000-00"
                            placeholderTextColor={colors.textSecondary}
                            value={cnpj}
                            onChangeText={handleCNPJChange}
                            keyboardType="numeric"
                            maxLength={18}
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Telefone (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="(85) 99999-9999"
                            placeholderTextColor={colors.textSecondary}
                            value={telefone}
                            onChangeText={handleTelefoneChange}
                            keyboardType="phone-pad"
                            maxLength={15}
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Endereço (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Rua, Número, Bairro"
                            placeholderTextColor={colors.textSecondary}
                            value={endereco}
                            onChangeText={setEndereco}
                            autoCapitalize="words"
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Cidade/Estado (opcional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Fortaleza - CE"
                            placeholderTextColor={colors.textSecondary}
                            value={cidade}
                            onChangeText={setCidade}
                            autoCapitalize="words"
                            editable={!salvando}
                        />
                    </View>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoIcon}>💡</Text>
                        <Text style={styles.infoText}>
                            Preencha os dados da sua empresa para que apareçam nos recibos impressos e compartilhados com os clientes.
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
                        <Text style={styles.btnSalvarText}>Salvar Dados</Text>
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
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.background,
        },
        loadingText: {
            marginTop: 12,
            fontSize: 16,
            color: colors.textSecondary,
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
            color: colors.primary,
            fontWeight: '500',
        },
        titulo: {
            fontSize: 28,
            fontWeight: '700',
            color: colors.text,
            marginBottom: 4,
        },
        subtitulo: {
            fontSize: 14,
            color: colors.textSecondary,
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
        label: {
            fontSize: 15,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
        },
        input: {
            backgroundColor: colors.inputBackground,
            borderRadius: 8,
            padding: 16,
            fontSize: 16,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.border,
        },
        infoBox: {
            flexDirection: 'row',
            backgroundColor: isDark ? colors.cardInfo : '#E3F2FD',
            borderRadius: 12,
            padding: 16,
            marginTop: 12,
        },
        infoIcon: {
            fontSize: 24,
            marginRight: 12,
        },
        infoText: {
            flex: 1,
            fontSize: 14,
            color: colors.text,
            lineHeight: 20,
        },
        footer: {
            backgroundColor: colors.card,
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        btnSalvar: {
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 18,
            alignItems: 'center',
        },
        btnSalvarDisabled: {
            opacity: 0.6,
        },
        btnSalvarText: {
            color: '#fff',
            fontSize: 18,
            fontWeight: '700',
        },
    });
}