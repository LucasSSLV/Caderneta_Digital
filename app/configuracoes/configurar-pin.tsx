// app/configuracoes/configurar-pin.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as authService from '../../services/auth';

export default function ConfigurarPIN() {
    const router = useRouter();
    const { verificarAuth } = useAuth();
    const [etapa, setEtapa] = useState<'criar' | 'confirmar'>('criar');
    const [pinCriado, setPinCriado] = useState('');
    const [pin, setPin] = useState('');

    useEffect(() => {
        if (pin.length === 4) {
            processarPin(pin);
        }
    }, [pin]);

    const adicionarDigito = (digito: string) => {
        if (pin.length < 4) {
            setPin(pin + digito);
        }
    };

    const processarPin = async (pinCompleto: string) => {
        if (etapa === 'criar') {
            setPinCriado(pinCompleto);
            setPin('');
            setEtapa('confirmar');
        } else {
            // Confirmar PIN
            if (pinCompleto === pinCriado) {
                try {
                    await authService.salvarPIN(pinCompleto);
                    Alert.alert(
                        'Sucesso',
                        'PIN configurado com sucesso!',
                        [
                            {
                                text: 'OK',
                                onPress: () => router.back(),
                            },
                        ]
                    );
                } catch (error) {
                    Alert.alert('Erro', 'Não foi possível salvar o PIN.');
                }
            } else {
                Alert.alert('Erro', 'Os PINs não coincidem. Tente novamente.');
                setPin('');
                setPinCriado('');
                setEtapa('criar');
            }
        }
    };

    const apagarDigito = () => {
        setPin(pin.slice(0, -1));
    };

    const renderPinDots = () => {
        return (
            <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.pinDot,
                            pin.length > index && styles.pinDotFilled,
                        ]}
                    />
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.btnVoltar}
                >
                    <Text style={styles.btnVoltarText}>← Cancelar</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.icon}>🔐</Text>
                <Text style={styles.titulo}>
                    {etapa === 'criar' ? 'Criar PIN' : 'Confirmar PIN'}
                </Text>
                <Text style={styles.subtitulo}>
                    {etapa === 'criar'
                        ? 'Digite um PIN de 4 dígitos'
                        : 'Digite o PIN novamente'}
                </Text>

                {renderPinDots()}

                <View style={styles.teclado}>
                    {[
                        ['1', '2', '3'],
                        ['4', '5', '6'],
                        ['7', '8', '9'],
                    ].map((linha, linhaIndex) => (
                        <View key={linhaIndex} style={styles.tecladoLinha}>
                            {linha.map((numero) => (
                                <TouchableOpacity
                                    key={numero}
                                    style={styles.tecla}
                                    onPress={() => adicionarDigito(numero)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.teclaTexto}>{numero}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}

                    <View style={styles.tecladoLinha}>
                        <View style={styles.tecla} />
                        <TouchableOpacity
                            style={styles.tecla}
                            onPress={() => adicionarDigito('0')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.teclaTexto}>0</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.tecla}
                            onPress={apagarDigito}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.teclaTexto}>⌫</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
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
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    titulo: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    subtitulo: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
    },
    pinContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 60,
    },
    pinDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#007AFF',
        backgroundColor: 'transparent',
    },
    pinDotFilled: {
        backgroundColor: '#007AFF',
    },
    teclado: {
        width: '100%',
        maxWidth: 320,
    },
    tecladoLinha: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    tecla: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    teclaTexto: {
        fontSize: 32,
        fontWeight: '600',
        color: '#1a1a1a',
    },
});