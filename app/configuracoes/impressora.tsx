// app/configuracoes/impressora.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import * as bluetoothPrinter from '../../services/bluetoothPrinter';

const PRINTER_KEY = '@caderneta:impressora_padrao';

export default function ConfigurarImpressora() {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const styles = createStyles(colors, isDark);

    const [impressoras, setImpressoras] = useState<bluetoothPrinter.PrinterDevice[]>([]);
    const [impressoraPadrao, setImpressoraPadrao] = useState<string>('');
    const [buscando, setBuscando] = useState(false);
    const [conectando, setConectando] = useState<string>('');

    useEffect(() => {
        carregarImpressoraPadrao();
    }, []);

    const carregarImpressoraPadrao = async () => {
        try {
            const saved = await AsyncStorage.getItem(PRINTER_KEY);
            if (saved) {
                setImpressoraPadrao(saved);
            }
        } catch (error) {
            console.error('Erro ao carregar impressora padrão:', error);
        }
    };

    const salvarImpressoraPadrao = async (address: string) => {
        try {
            await AsyncStorage.setItem(PRINTER_KEY, address);
            setImpressoraPadrao(address);
        } catch (error) {
            console.error('Erro ao salvar impressora padrão:', error);
        }
    };

    const handleBuscarImpressoras = async () => {
        setBuscando(true);
        try {
            const dispositivos = await bluetoothPrinter.buscarImpressoras();

            if (dispositivos.length === 0) {
                Alert.alert(
                    'Nenhuma Impressora Encontrada',
                    'Certifique-se de que:\n\n• A impressora está ligada\n• O Bluetooth está ativo\n• A impressora está pareada com seu celular\n\nVá em Configurações > Bluetooth e pareie a impressora primeiro.'
                );
            }

            setImpressoras(dispositivos);
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível buscar impressoras.');
        } finally {
            setBuscando(false);
        }
    };

    const handleConectar = async (impressora: bluetoothPrinter.PrinterDevice) => {
        setConectando(impressora.address);

        try {
            const conectado = await bluetoothPrinter.conectarImpressora(impressora.address);

            if (conectado) {
                await salvarImpressoraPadrao(impressora.address);

                Alert.alert(
                    'Conectado!',
                    `Conectado à ${impressora.name}`,
                    [
                        {
                            text: 'Imprimir Teste',
                            onPress: () => bluetoothPrinter.imprimirTeste(impressora.address)
                        },
                        { text: 'OK' }
                    ]
                );
            }
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível conectar à impressora.');
        } finally {
            setConectando('');
        }
    };

    const handleDesconectar = async () => {
        try {
            await bluetoothPrinter.desconectarImpressora();
            await AsyncStorage.removeItem(PRINTER_KEY);
            setImpressoraPadrao('');
            Alert.alert('Sucesso', 'Impressora desconectada.');
        } catch (error) {
            Alert.alert('Erro', 'Não foi possível desconectar.');
        }
    };

    const handleImprimirTeste = async () => {
        if (!impressoraPadrao) {
            Alert.alert('Aviso', 'Conecte uma impressora primeiro.');
            return;
        }

        await bluetoothPrinter.imprimirTeste(impressoraPadrao);
    };

    const renderImpressora = ({ item }: { item: bluetoothPrinter.PrinterDevice }) => {
        const isPadrao = item.address === impressoraPadrao;
        const isConectando = conectando === item.address;

        return (
            <TouchableOpacity
                style={[styles.impressoraCard, isPadrao && styles.impressoraCardAtiva]}
                onPress={() => handleConectar(item)}
                disabled={isConectando}
                activeOpacity={0.7}
            >
                <View style={styles.impressoraInfo}>
                    <Text style={styles.impressoraNome}>{item.name}</Text>
                    <Text style={styles.impressoraEndereco}>{item.address}</Text>
                </View>

                {isConectando ? (
                    <ActivityIndicator color={colors.primary} />
                ) : isPadrao ? (
                    <View style={styles.badgeConectada}>
                        <Text style={styles.badgeText}>✓ Padrão</Text>
                    </View>
                ) : (
                    <Text style={styles.btnConectar}>Conectar</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Voltar</Text>
                </TouchableOpacity>

                <Text style={styles.titulo}>🖨️ Configurar Impressora</Text>
                <Text style={styles.subtitulo}>
                    Conecte uma impressora Bluetooth térmica
                </Text>
            </View>

            <View style={styles.content}>
                <View style={styles.infoBox}>
                    <Text style={styles.infoIcon}>💡</Text>
                    <Text style={styles.infoText}>
                        Certifique-se de que a impressora está pareada com seu celular nas configurações de Bluetooth antes de buscar.
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.btnBuscar}
                    onPress={handleBuscarImpressoras}
                    disabled={buscando}
                    activeOpacity={0.8}
                >
                    {buscando ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.btnBuscarIcon}>🔍</Text>
                            <Text style={styles.btnBuscarText}>Buscar Impressoras</Text>
                        </>
                    )}
                </TouchableOpacity>

                {impressoraPadrao && (
                    <View style={styles.acoesContainer}>
                        <TouchableOpacity
                            style={styles.btnAcao}
                            onPress={handleImprimirTeste}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnAcaoText}>📄 Imprimir Teste</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.btnAcao, styles.btnAcaoSecundario]}
                            onPress={handleDesconectar}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.btnAcaoText}>🔌 Desconectar</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList
                    data={impressoras}
                    keyExtractor={(item) => item.address}
                    renderItem={renderImpressora}
                    contentContainerStyle={styles.lista}
                    ListEmptyComponent={
                        !buscando ? (
                            <View style={styles.empty}>
                                <Text style={styles.emptyText}>🖨️</Text>
                                <Text style={styles.emptyTitle}>Nenhuma impressora encontrada</Text>
                                <Text style={styles.emptySubtitle}>
                                    Toque em Buscar Impressoras para encontrar dispositivos pareados
                                </Text>
                            </View>
                        ) : null
                    }
                />
            </View>
        </View>
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
            padding: 16,
        },
        infoBox: {
            flexDirection: 'row',
            backgroundColor: colors.cardInfo,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
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
        btnBuscar: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.primary,
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            gap: 8,
        },
        btnBuscarIcon: {
            fontSize: 20,
        },
        btnBuscarText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
        },
        acoesContainer: {
            flexDirection: 'row',
            gap: 12,
            marginBottom: 16,
        },
        btnAcao: {
            flex: 1,
            backgroundColor: colors.success,
            borderRadius: 8,
            padding: 12,
            alignItems: 'center',
        },
        btnAcaoSecundario: {
            backgroundColor: colors.danger,
        },
        btnAcaoText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: '600',
        },
        lista: {
            paddingBottom: 16,
        },
        impressoraCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 2,
            borderColor: 'transparent',
        },
        impressoraCardAtiva: {
            borderColor: colors.success,
            backgroundColor: colors.cardSuccess,
        },
        impressoraInfo: {
            flex: 1,
        },
        impressoraNome: {
            fontSize: 16,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 4,
        },
        impressoraEndereco: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        badgeConectada: {
            backgroundColor: colors.success,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
        },
        badgeText: {
            color: '#fff',
            fontSize: 12,
            fontWeight: '600',
        },
        btnConectar: {
            color: colors.primary,
            fontSize: 14,
            fontWeight: '600',
        },
        empty: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 60,
            paddingHorizontal: 40,
        },
        emptyText: {
            fontSize: 64,
            marginBottom: 16,
        },
        emptyTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: colors.text,
            marginBottom: 8,
            textAlign: 'center',
        },
        emptySubtitle: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
    });
}