// app/auth.tsx
import { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/auth';


export default function AuthScreen() {
    // const router = useRouter();
    const { login } = useAuth();
    const [pin, setPin] = useState('');
    const [temBiometria, setTemBiometria] = useState(false);
    const [tentativas, setTentativas] = useState(0); 

    useEffect(() => {
        verificarBiometria();
        tentarBiometriaAutomaticamente();
    }, []);

    const verificarBiometria = async () => {
        const suporte = await authService.verificarSuporteBiometria();
        setTemBiometria(suporte);
    };

    const tentarBiometriaAutomaticamente = async () => {
        if (await authService.verificarSuporteBiometria()) {
            const sucesso = await authService.autenticarComBiometria();
            if (sucesso) {
                login();
            }
        }
    };

    const handleBiometria = async () => {
        const sucesso = await authService.autenticarComBiometria();
        if (sucesso) {
            login();
        }
    };

    const adicionarDigito = (digito: string) => {
        if (pin.length < 4) {
            const novoPin = pin + digito;
            setPin(novoPin);

            if (novoPin.length === 4) {
                verificarPin(novoPin);
            }
        }
    };

    const verificarPin = async (pinCompleto: string) => {
        const correto = await authService.verificarPIN(pinCompleto);

        if (correto) {
            login();
        } else {
            Vibration.vibrate(500);
            setPin('');
            setTentativas(tentativas + 1);

            if (tentativas >= 2) {
                Alert.alert(
                    'Muitas tentativas',
                    'Você errou 3 vezes. Tente novamente em 30 segundos.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert('PIN Incorreto', 'Tente novamente.');
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
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.titulo}>Caderneta Digital</Text>
                <Text style={styles.subtitulo}>Digite seu PIN para acessar</Text>
            </View>

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
                    {temBiometria && (
                        <TouchableOpacity
                            style={styles.tecla}
                            onPress={handleBiometria}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.teclaTexto}>👆</Text>
                        </TouchableOpacity>
                    )}
                    {!temBiometria && <View style={styles.tecla} />}

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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 60,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    titulo: {
        fontSize: 32,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    subtitulo: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
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
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    pinDotFilled: {
        backgroundColor: '#fff',
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
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    teclaTexto: {
        fontSize: 32,
        fontWeight: '600',
        color: '#fff',
    },
});