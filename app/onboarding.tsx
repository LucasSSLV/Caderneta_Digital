// app/onboarding.tsx
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/auth';

export default function OnboardingScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const [etapa, setEtapa] = useState<'boas-vindas' | 'biometria' | 'pin'>('boas-vindas');
    const [temBiometria, setTemBiometria] = useState(false);
    const [biometriaConfigurada, setBiometriaConfigurada] = useState(false);
    const [pin, setPin] = useState('');
    const [pinConfirmacao, setPinConfirmacao] = useState('');
    const [criandoPin, setCriandoPin] = useState(false);

    useEffect(() => {
        verificarBiometria();
    }, []);

    const verificarBiometria = async () => {
        const suporte = await authService.verificarSuporteBiometria();
        setTemBiometria(suporte);
    };

    const handleProximo = () => {
        if (etapa === 'boas-vindas') {
            if (temBiometria) {
                setEtapa('biometria');
            } else {
                setEtapa('pin');
            }
        } else if (etapa === 'biometria') {
            setEtapa('pin');
        }
    };

    const handlePularBiometria = () => {
        setBiometriaConfigurada(false);
        setEtapa('pin');
    };

    const handleConfigurarBiometria = async () => {
        const sucesso = await authService.autenticarComBiometria();
        if (sucesso) {
            setBiometriaConfigurada(true);
            Alert.alert(
                'Biometria Configurada!',
                'Sua biometria foi cadastrada com sucesso.',
                [{ text: 'Continuar', onPress: () => setEtapa('pin') }]
            );
        } else {
            Alert.alert(
                'Erro',
                'Não foi possível configurar a biometria. Você pode tentar novamente nas configurações.',
                [{ text: 'OK', onPress: handlePularBiometria }]
            );
        }
    };

    const adicionarDigito = (digito: string) => {
        if (!criandoPin) {
            if (pin.length < 4) {
                const novoPin = pin + digito;
                setPin(novoPin);
                if (novoPin.length === 4) {
                    setCriandoPin(true);
                }
            }
        } else {
            if (pinConfirmacao.length < 4) {
                const novaConfirmacao = pinConfirmacao + digito;
                setPinConfirmacao(novaConfirmacao);
                if (novaConfirmacao.length === 4) {
                    verificarPins(pin, novaConfirmacao);
                }
            }
        }
    };

    const verificarPins = async (pinCriado: string, pinConf: string) => {
        if (pinCriado === pinConf) {
            try {
                await authService.salvarPIN(pinCriado);
                await authService.marcarOnboardingCompleto();

                Alert.alert(
                    'Configuração Completa!',
                    'Seu PIN foi cadastrado com sucesso. Agora você pode usar o app com segurança!',
                    [
                        {
                            text: 'Começar',
                            onPress: () => {
                                login();
                                router.replace('/');
                            }
                        }
                    ]
                );
            } catch (error) {
                Alert.alert('Erro', 'Não foi possível salvar o PIN.');
                setPin('');
                setPinConfirmacao('');
                setCriandoPin(false);
            }
        } else {
            Alert.alert(
                'PINs não coincidem',
                'Os PINs digitados são diferentes. Tente novamente.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setPin('');
                            setPinConfirmacao('');
                            setCriandoPin(false);
                        }
                    }
                ]
            );
        }
    };

    const apagarDigito = () => {
        if (!criandoPin) {
            setPin(pin.slice(0, -1));
        } else {
            setPinConfirmacao(pinConfirmacao.slice(0, -1));
        }
    };

    const handlePularTudo = async () => {
        Alert.alert(
            'Pular Configuração?',
            'Não é recomendado pular a configuração de segurança. Seus dados ficarão desprotegidos.\n\nDeseja continuar mesmo assim?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Pular',
                    style: 'destructive',
                    onPress: async () => {
                        await authService.marcarOnboardingCompleto();
                        login();
                        router.replace('/');
                    }
                }
            ]
        );
    };

    const renderPinDots = () => {
        const dots = criandoPin ? pinConfirmacao : pin;
        return (
            <View style={styles.pinContainer}>
                {[0, 1, 2, 3].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.pinDot,
                            dots.length > index && styles.pinDotFilled,
                        ]}
                    />
                ))}
            </View>
        );
    };

    if (etapa === 'boas-vindas') {
        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeIcon}>📓</Text>
                        <Text style={styles.welcomeTitle}>Bem-vindo à</Text>
                        <Text style={styles.welcomeAppName}>Caderneta Digital</Text>

                        <View style={styles.featuresContainer}>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>👥</Text>
                                <Text style={styles.featureText}>Gerencie seus clientes</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>💰</Text>
                                <Text style={styles.featureText}>Controle vendas e pagamentos</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📦</Text>
                                <Text style={styles.featureText}>Organize seu estoque</Text>
                            </View>
                            <View style={styles.featureItem}>
                                <Text style={styles.featureIcon}>📊</Text>
                                <Text style={styles.featureText}>Acompanhe relatórios</Text>
                            </View>
                        </View>

                        <View style={styles.securityInfo}>
                            <Text style={styles.securityIcon}>🔒</Text>
                            <Text style={styles.securityText}>
                                Vamos configurar a segurança do app para proteger seus dados
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={handleProximo}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnPrimaryText}>Começar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handlePularTudo}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnSecondaryText}>Pular (não recomendado)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (etapa === 'biometria') {
        return (
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.stepIndicator}>
                        <View style={[styles.stepDot, styles.stepDotActive]} />
                        <View style={styles.stepDot} />
                    </View>

                    <Text style={styles.icon}>👆</Text>
                    <Text style={styles.titulo}>Biometria Detectada</Text>
                    <Text style={styles.subtitulo}>
                        Seu dispositivo suporta autenticação biométrica.{'\n'}
                        Deseja ativá-la para maior segurança?
                    </Text>

                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>⚡</Text>
                            <Text style={styles.benefitText}>Acesso rápido</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>🔐</Text>
                            <Text style={styles.benefitText}>Mais seguro</Text>
                        </View>
                        <View style={styles.benefitItem}>
                            <Text style={styles.benefitIcon}>✨</Text>
                            <Text style={styles.benefitText}>Prático</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={handleConfigurarBiometria}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnPrimaryText}>Ativar Biometria</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={handlePularBiometria}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.btnSecondaryText}>Pular</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Etapa PIN
    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.stepIndicator}>
                    <View style={[styles.stepDot, styles.stepDotActive]} />
                    <View style={[styles.stepDot, temBiometria && styles.stepDotActive]} />
                </View>

                <Text style={styles.icon}>🔐</Text>
                <Text style={styles.titulo}>
                    {!criandoPin ? 'Crie seu PIN' : 'Confirme seu PIN'}
                </Text>
                <Text style={styles.subtitulo}>
                    {!criandoPin
                        ? 'Digite um PIN de 4 dígitos para proteger seus dados'
                        : 'Digite o PIN novamente para confirmar'
                    }
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
    scrollContent: {
        flexGrow: 1,
    },
    welcomeContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    welcomeIcon: {
        fontSize: 80,
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 24,
        color: '#666',
        marginBottom: 8,
    },
    welcomeAppName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 48,
        textAlign: 'center',
    },
    featuresContainer: {
        width: '100%',
        gap: 20,
        marginBottom: 48,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    featureIcon: {
        fontSize: 32,
        marginRight: 16,
    },
    featureText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    securityInfo: {
        backgroundColor: '#E3F2FD',
        padding: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    securityIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    securityText: {
        flex: 1,
        fontSize: 14,
        color: '#1565C0',
        lineHeight: 20,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    stepIndicator: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    stepDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ddd',
    },
    stepDotActive: {
        backgroundColor: '#007AFF',
    },
    icon: {
        fontSize: 64,
        marginBottom: 24,
    },
    titulo: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitulo: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
    },
    benefitsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 32,
    },
    benefitItem: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    benefitIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    benefitText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1a1a1a',
        textAlign: 'center',
    },
    pinContainer: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 48,
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
        marginBottom: 16,
    },
    tecla: {
        width: 72,
        height: 72,
        borderRadius: 36,
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
        fontSize: 28,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        gap: 12,
    },
    btnPrimary: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    btnPrimaryText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    btnSecondary: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
    },
    btnSecondaryText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
});