// services/auth.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'caderneta_pin';
const AUTH_ENABLED_KEY = 'caderneta_auth_enabled';

export const verificarSuporteBiometria = async (): Promise<boolean> => {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
};

export const autenticarComBiometria = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para acessar',
      fallbackLabel: 'Usar PIN',
      cancelLabel: 'Cancelar',
    });
    
    return result.success;
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error);
    return false;
  }
};

export const salvarPIN = async (pin: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    await SecureStore.setItemAsync(AUTH_ENABLED_KEY, 'true');
  } catch (error) {
    console.error('Erro ao salvar PIN:', error);
    throw error;
  }
};

export const verificarPIN = async (pin: string): Promise<boolean> => {
  try {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    return storedPin === pin;
  } catch (error) {
    console.error('Erro ao verificar PIN:', error);
    return false;
  }
};

export const autenticacaoEstaAtiva = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(AUTH_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
};

export const desativarAutenticacao = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(PIN_KEY);
    await SecureStore.deleteItemAsync(AUTH_ENABLED_KEY);
  } catch (error) {
    console.error('Erro ao desativar autenticação:', error);
    throw error;
  }
};

export const alterarPIN = async (pinAtual: string, novoPIN: string): Promise<boolean> => {
  try {
    const pinCorreto = await verificarPIN(pinAtual);
    if (!pinCorreto) return false;
    
    await salvarPIN(novoPIN);
    return true;
  } catch (error) {
    console.error('Erro ao alterar PIN:', error);
    return false;
  }
};