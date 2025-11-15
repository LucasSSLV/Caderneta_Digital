// app/index.tsx - EXEMPLO COM TEMA ESCURO
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as storage from '../services/storage';
import { Cliente, Compra, Produto } from '../types';

export default function Index() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState(0);

  const styles = createStyles(colors, isDark);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [clientesData, comprasData, produtosData, estoqueBaixo] = await Promise.all([
        storage.carregarClientes(),
        storage.carregarCompras(),
        storage.carregarProdutos(),
        storage.buscarProdutosEstoqueBaixo(),
      ]);
      setClientes(clientesData);
      setCompras(comprasData);
      setProdutos(produtosData);
      setProdutosEstoqueBaixo(estoqueBaixo.length);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const calcularEstatisticas = () => {
    const totalClientes = clientes.length;

    const clientesDevedores = clientes.filter(cliente => {
      const comprasCliente = compras.filter(c => c.clienteId === cliente.id);
      const totalDevido = storage.calcularTotalDevido(comprasCliente);
      return totalDevido > 0;
    }).length;

    const totalDevido = compras
      .filter(c => !c.pago)
      .reduce((sum, c) => sum + c.valorTotal, 0);

    const totalPago = compras
      .filter(c => c.pago)
      .reduce((sum, c) => sum + c.valorTotal, 0);

    const totalCompras = compras.length;
    const comprasPendentes = compras.filter(c => !c.pago).length;
    const totalProdutos = produtos.length;

    return {
      totalClientes,
      clientesDevedores,
      totalDevido,
      totalPago,
      totalCompras,
      comprasPendentes,
      totalProdutos,
    };
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const stats = calcularEstatisticas();

  return (
    <View style={styles.container}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.titulo}>📓 Caderneta Digital</Text>
            <Text style={styles.subtitulo}>Bem-vindo de volta!</Text>
          </View>
          <TouchableOpacity
            style={styles.btnConfig}
            onPress={() => router.push('/configuracoes')}
            activeOpacity={0.7}
          >
            <Text style={styles.btnConfigText}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ALERTA DE ESTOQUE BAIXO */}
        {produtosEstoqueBaixo > 0 && (
          <TouchableOpacity
            style={styles.alertaEstoque}
            onPress={() => router.push('/produtos/entrada-estoque')}
            activeOpacity={0.7}
          >
            <View style={styles.alertaIconContainer}>
              <Text style={styles.alertaIcon}>⚠️</Text>
            </View>
            <View style={styles.alertaContent}>
              <Text style={styles.alertaTitulo}>Atenção: Estoque Baixo!</Text>
              <Text style={styles.alertaTexto}>
                {produtosEstoqueBaixo} {produtosEstoqueBaixo === 1 ? 'produto precisa' : 'produtos precisam'} de reposição
              </Text>
            </View>
            <Text style={styles.alertaSeta}>›</Text>
          </TouchableOpacity>
        )}

        {/* Cards de Estatísticas Principais */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statLabel}>Total a Receber</Text>
            <Text style={[styles.statValue, styles.statValueLarge, styles.valorDevido]}>
              {formatarValor(stats.totalDevido)}
            </Text>
          </View>

          <View style={[styles.statCard, styles.statCardLarge]}>
            <Text style={styles.statLabel}>Total Recebido</Text>
            <Text style={[styles.statValue, styles.statValueLarge, styles.valorPago]}>
              {formatarValor(stats.totalPago)}
            </Text>
          </View>
        </View>

        {/* Menu Principal */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Menu Principal</Text>

          <View style={styles.menuGrid}>
            {/* Clientes */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/clientes/lista')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
                <Text style={styles.menuIconText}>👥</Text>
              </View>
              <Text style={styles.menuTitle}>Clientes</Text>
              <Text style={[styles.menuCount, { color: colors.primary }]}>{stats.totalClientes}</Text>
            </TouchableOpacity>

            {/* Produtos */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/produtos/lista')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardPurple : '#F3E5F5' }]}>
                <Text style={styles.menuIconText}>📦</Text>
              </View>
              <Text style={styles.menuTitle}>Produtos</Text>
              <Text style={[styles.menuCount, { color: colors.secondary }]}>{stats.totalProdutos}</Text>
            </TouchableOpacity>

            {/* Devedores */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/clientes/devedores')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardDanger : '#FFEBEE' }]}>
                <Text style={styles.menuIconText}>💰</Text>
              </View>
              <Text style={styles.menuTitle}>Devedores</Text>
              <Text style={[styles.menuCount, { color: colors.danger }]}>{stats.clientesDevedores}</Text>
            </TouchableOpacity>

            {/* Compras Pendentes */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/compras/pendentes')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardWarning : '#FFF3E0' }]}>
                <Text style={styles.menuIconText}>📋</Text>
              </View>
              <Text style={styles.menuTitle}>Pendentes</Text>
              <Text style={[styles.menuCount, { color: colors.warning }]}>{stats.comprasPendentes}</Text>
            </TouchableOpacity>

            {/* Compras Pagas */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/compras/pagas')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardSuccess : '#E8F5E9' }]}>
                <Text style={styles.menuIconText}>✅</Text>
              </View>
              <Text style={styles.menuTitle}>Pagas</Text>
              <Text style={[styles.menuCount, { color: colors.success }]}>
                {stats.totalCompras - stats.comprasPendentes}
              </Text>
            </TouchableOpacity>

            {/* Relatórios */}
            <TouchableOpacity
              style={styles.menuCard}
              onPress={() => router.push('/relatorios')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: isDark ? colors.cardInfo : '#E1F5FE' }]}>
                <Text style={styles.menuIconText}>📊</Text>
              </View>
              <Text style={styles.menuTitle}>Relatórios</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Ações Rápidas */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/clientes/novo')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📚</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Novo Cliente</Text>
              <Text style={styles.actionSubtitle}>Cadastrar um novo cliente</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/produtos/historico-movimentacoes')}
            activeOpacity={0.8}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>📋</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Histórico de Movimentações</Text>
              <Text style={styles.actionSubtitle}>Histórico de movimentações de produtos</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      marginBottom: 60,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    btnConfig: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? colors.cardInfo : '#E3F2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnConfigText: {
      fontSize: 20,
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
      backgroundColor: colors.primary,
      paddingTop: 60,
      paddingBottom: 24,
      paddingHorizontal: 20,
    },
    titulo: {
      fontSize: 28,
      fontWeight: '700',
      color: '#fff',
      marginBottom: 4,
    },
    subtitulo: {
      fontSize: 16,
      color: '#fff',
      opacity: 0.9,
    },
    content: {
      flex: 1,
    },
    alertaEstoque: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardWarning,
      marginHorizontal: 16,
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    alertaIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? colors.cardWarning : '#FFE0B2',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    alertaIcon: {
      fontSize: 24,
    },
    alertaContent: {
      flex: 1,
    },
    alertaTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.warning,
      marginBottom: 4,
    },
    alertaTexto: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    alertaSeta: {
      fontSize: 28,
      color: colors.warning,
      fontWeight: '300',
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statCardLarge: {
      paddingVertical: 20,
    },
    statLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: '500',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    statValueLarge: {
      fontSize: 24,
    },
    valorDevido: {
      color: colors.danger,
    },
    valorPago: {
      color: colors.success,
    },
    menuContainer: {
      paddingHorizontal: 16,
      paddingTop: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    menuCard: {
      width: '48%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    menuIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    menuIconText: {
      fontSize: 32,
    },
    menuTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    menuCount: {
      fontSize: 24,
      fontWeight: '700',
    },
    actionsContainer: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 24,
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? colors.cardInfo : '#E3F2FD',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionIconText: {
      fontSize: 24,
    },
    actionContent: {
      flex: 1,
    },
    actionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    actionSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    actionArrow: {
      fontSize: 28,
      color: colors.border,
      fontWeight: '300',
    },
  });
}