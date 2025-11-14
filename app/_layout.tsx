// app/_layout.tsx - ATUALIZADO COM ONBOARDING
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function RootLayoutNav() {
  const { isAuthenticated, isLoading, needsOnboarding } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboardingGroup = segments[0] === 'onboarding';

    // Prioridade 1: Onboarding
    if (needsOnboarding && !inOnboardingGroup) {
      router.replace('/onboarding');
      return;
    }

    // Prioridade 2: Autenticação
    if (!needsOnboarding && !isAuthenticated && !inAuthGroup) {
      router.replace('/auth');
      return;
    }

    // Prioridade 3: Home (já está autenticado e onboarding completo)
    if (!needsOnboarding && isAuthenticated && (inAuthGroup || inOnboardingGroup)) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, segments, isLoading, needsOnboarding]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="clientes/lista" options={{ title: 'Clientes' }} />
      <Stack.Screen name="clientes/devedores" options={{ title: 'Devedores' }} />
      <Stack.Screen name="clientes/[id]" options={{ title: 'Detalhes', presentation: 'card' }} />
      <Stack.Screen name="clientes/novo" options={{ title: 'Novo Cliente', presentation: 'modal' }} />
      <Stack.Screen name="clientes/editar/[id]" options={{ title: 'Editar Cliente', presentation: 'modal' }} />
      <Stack.Screen name="compras/nova" options={{ title: 'Nova Compra', presentation: 'modal' }} />
      <Stack.Screen name="compras/pendentes" options={{ title: 'Pendentes' }} />
      <Stack.Screen name="compras/pagas" options={{ title: 'Pagas' }} />
      <Stack.Screen name="produtos/lista" options={{ title: 'Produtos' }} />
      <Stack.Screen name="produtos/novo" options={{ title: 'Novo Produto', presentation: 'modal' }} />
      <Stack.Screen name="produtos/[id]" options={{ title: 'Editar Produto', presentation: 'modal' }} />
      <Stack.Screen name="produtos/entrada-estoque" options={{ title: 'Entrada de Estoque', presentation: 'modal' }} />
      <Stack.Screen name="produtos/historico-movimentacoes" options={{ title: 'Histórico de Movimentações' }} />
      <Stack.Screen name="relatorios/index" options={{ title: 'Relatórios' }} />
      <Stack.Screen name="relatorios/exportar" options={{ title: 'Exportar Relatórios', presentation: 'modal' }} />
      <Stack.Screen name="configuracoes/index" options={{ title: 'Configurações' }} />
      <Stack.Screen name="configuracoes/configurar-pin" options={{ title: 'Configurar PIN', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}