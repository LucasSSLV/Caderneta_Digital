// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#f5f5f5' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="clientes/lista"
        options={{
          title: 'Clientes',
        }}
      />
      <Stack.Screen
        name="clientes/devedores"
        options={{
          title: 'Devedores',
        }}
      />
      <Stack.Screen
        name="clientes/[id]"
        options={{
          title: 'Detalhes',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="clientes/novo"
        options={{
          title: 'Novo Cliente',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="compras/nova"
        options={{
          title: 'Nova Compra',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="compras/pendentes"
        options={{
          title: 'Pendentes',
        }}
      />
      <Stack.Screen
        name="compras/pagas"
        options={{
          title: 'Pagas',
        }}
      />
      {/* <Stack.Screen
        name="compras/pagas"
        options={{
          title: 'Pagas',
        }}
      /> */}
      <Stack.Screen
        name="produtos/entrada-estoque"
        options={{
          title: 'Entrada de Estoque',
          presentation: 'modal',
        }}
      />
    </Stack>

  );
}