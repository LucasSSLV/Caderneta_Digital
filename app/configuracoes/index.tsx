// app/configuracoes/index.tsx - COM SELETOR DE TEMA
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import * as authService from "../../services/auth";
import * as storage from "../../services/storage";

export default function Configuracoes() {
  const router = useRouter();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [tamanhoArmazenamento, setTamanhoArmazenamento] = useState(0);
  const [estatisticas, setEstatisticas] = useState({
    clientes: 0,
    compras: 0,
    produtos: 0,
    movimentacoes: 0,
  });
  const [configuracoes, setConfiguracoes] = useState({
    manterMovimentacoes: true,
    diasRetencao: 90,
    limparAutomaticamente: false,
  });
  const [authAtiva, setAuthAtiva] = useState(false);

  const styles = createStyles(colors, isDark);

  useEffect(() => {
    carregarDados();
    carregarConfiguracoes();
    const verificarAuth = async () => {
      const ativa = await authService.autenticacaoEstaAtiva();
      setAuthAtiva(ativa);
    };
    verificarAuth();
  }, []);

  const handleSelecionarTema = () => {
    Alert.alert(
      '🎨 Selecionar Tema',
      'Escolha o tema do aplicativo:',
      [
        {
          text: '☀️ Claro',
          onPress: () => setThemeMode('light'),
        },
        {
          text: '🌙 Escuro',
          onPress: () => setThemeMode('dark'),
        },
        {
          text: '🔄 Automático',
          onPress: () => setThemeMode('auto'),
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  const getTemaAtualTexto = () => {
    if (themeMode === 'auto') return '🔄 Automático';
    if (themeMode === 'dark') return '🌙 Escuro';
    return '☀️ Claro';
  };

  // ... resto das funções permanecem iguais ...
  const handleConfigurarPIN = () => {
    router.push('/configuracoes/configurar-pin');
  };

  const handleDesativarPIN = async () => {
    Alert.alert(
      'Desativar PIN',
      'Tem certeza que deseja desativar a proteção por PIN?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.desativarAutenticacao();
              setAuthAtiva(false);
              Alert.alert('Sucesso', 'PIN desativado com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível desativar o PIN.');
            }
          },
        },
      ]
    );
  };

  const handleResetarOnboarding = async () => {
    Alert.alert(
      'Resetar Tutorial',
      'Deseja ver novamente o tutorial de boas-vindas?\n\nVocê será desconectado e voltará à tela inicial.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          onPress: async () => {
            try {
              await authService.resetarOnboarding();
              Alert.alert(
                'Tutorial Resetado',
                'Reinicie o app para ver o tutorial novamente.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/onboarding');
                    }
                  }
                ]
              );
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível resetar o tutorial.');
            }
          },
        },
      ]
    );
  };

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [clientes, compras, produtos, movimentacoes] = await Promise.all([
        storage.carregarClientes(),
        storage.carregarCompras(),
        storage.carregarProdutos(),
        storage.carregarMovimentacoes(),
      ]);

      setEstatisticas({
        clientes: clientes.length,
        compras: compras.length,
        produtos: produtos.length,
        movimentacoes: movimentacoes.length,
      });

      const tamanho =
        JSON.stringify(clientes).length +
        JSON.stringify(compras).length +
        JSON.stringify(produtos).length +
        JSON.stringify(movimentacoes).length;

      setTamanhoArmazenamento(tamanho / 1024);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const carregarConfiguracoes = async () => {
    try {
      const config = await AsyncStorage.getItem("@caderneta:configuracoes");
      if (config) {
        setConfiguracoes(JSON.parse(config));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const salvarConfiguracoes = async (novasConfig: any) => {
    try {
      await AsyncStorage.setItem(
        "@caderneta:configuracoes",
        JSON.stringify(novasConfig)
      );
      setConfiguracoes(novasConfig);
    } catch (error) {
      console.error(error);
    }
  };

  const limparMovimentacoesAntigas = async () => {
    Alert.alert(
      "Limpar Movimentações Antigas",
      `Deseja remover movimentações com mais de ${configuracoes.diasRetencao} dias?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            try {
              const movimentacoes = await storage.carregarMovimentacoes();
              const dataLimite = new Date();
              dataLimite.setDate(
                dataLimite.getDate() - configuracoes.diasRetencao
              );

              const movimentacoesFiltradas = movimentacoes.filter(
                (m) => new Date(m.data) > dataLimite
              );

              const removidas =
                movimentacoes.length - movimentacoesFiltradas.length;

              await storage.salvarMovimentacoes(movimentacoesFiltradas);
              await carregarDados();

              Alert.alert(
                "Sucesso",
                `${removidas} movimentações antigas foram removidas.`
              );
            } catch (error) {
              Alert.alert("Erro", "Não foi possível limpar as movimentações.");
            }
          },
        },
      ]
    );
  };

  const limparComprasPagas = async () => {
    Alert.alert(
      "Arquivar Compras Pagas",
      "Deseja arquivar todas as compras já pagas?\n\nIsso reduzirá o tamanho do app.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Arquivar",
          style: "default",
          onPress: async () => {
            try {
              const compras = await storage.carregarCompras();
              const comprasPagas = compras.filter((c) => c.pago);
              const comprasAtivas = compras.filter((c) => !c.pago);

              await AsyncStorage.setItem(
                "@caderneta:compras_arquivadas",
                JSON.stringify(comprasPagas)
              );

              await storage.salvarCompras(comprasAtivas);
              await carregarDados();

              Alert.alert(
                "Sucesso",
                `${comprasPagas.length} compras pagas foram arquivadas.`
              );
            } catch (error) {
              Alert.alert("Erro", "Não foi possível arquivar as compras.");
            }
          },
        },
      ]
    );
  };

  const limparTodosOsDados = async () => {
    Alert.alert(
      "⚠️ ATENÇÃO",
      "Deseja APAGAR TODOS OS DADOS?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "APAGAR TUDO",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmação Final",
              "Tem ABSOLUTA CERTEZA?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "SIM, APAGAR",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await storage.limparTodosDados();
                      await carregarDados();
                      Alert.alert("Concluído", "Todos os dados foram removidos.");
                    } catch (error) {
                      Alert.alert("Erro", "Não foi possível limpar os dados.");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const restaurarComprasArquivadas = async () => {
    try {
      const arquivadas = await AsyncStorage.getItem("@caderneta:compras_arquivadas");
      if (!arquivadas) {
        Alert.alert("Informação", "Não há compras arquivadas para restaurar.");
        return;
      }

      Alert.alert(
        "Restaurar Compras",
        "Deseja restaurar todas as compras arquivadas?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Restaurar",
            onPress: async () => {
              try {
                const comprasArquivadas = JSON.parse(arquivadas);
                const comprasAtivas = await storage.carregarCompras();
                const todasCompras = [...comprasAtivas, ...comprasArquivadas];

                await storage.salvarCompras(todasCompras);
                await AsyncStorage.removeItem("@caderneta:compras_arquivadas");
                await carregarDados();

                Alert.alert(
                  "Sucesso",
                  `${comprasArquivadas.length} compras foram restauradas.`
                );
              } catch (error) {
                Alert.alert("Erro", "Não foi possível restaurar as compras.");
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error(error);
    }
  };

  const formatarTamanho = (kb: number) => {
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Carregando...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.btnVoltar}
        >
          <Text style={[styles.btnVoltarText, { color: colors.primary }]}>← Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.titulo}>⚙️ Configurações</Text>
        <Text style={styles.subtitulo}>
          Gerenciamento de dados e preferências
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* APARÊNCIA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Aparência</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleSelecionarTema}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>
                {themeMode === 'dark' ? '🌙' : themeMode === 'light' ? '☀️' : '🔄'}
              </Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Tema do Aplicativo</Text>
              <Text style={styles.actionDescription}>
                {getTemaAtualTexto()}
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Empresa */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏢 Empresa</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/configuracoes/dados-empresa')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>🏢</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Dados da Empresa</Text>
              <Text style={styles.actionDescription}>
                Configure nome, CNPJ e endereço para recibos
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/configuracoes/impressora')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardPurple : '#F3E5F5' }]}>
              <Text style={styles.actionIconText}>🖨️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Impressora Bluetooth</Text>
              <Text style={styles.actionDescription}>
                Configure impressora térmica para recibos
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Uso de Armazenamento */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💾 Uso de Armazenamento</Text>

          <View style={styles.storageCard}>
            <View style={styles.storageHeader}>
              <Text style={[styles.storageSize, { color: colors.primary }]}>
                {formatarTamanho(tamanhoArmazenamento)}
              </Text>
              <Text style={styles.storageLabel}>em uso</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estatisticas.clientes}</Text>
                <Text style={styles.statLabel}>Clientes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estatisticas.compras}</Text>
                <Text style={styles.statLabel}>Compras</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{estatisticas.produtos}</Text>
                <Text style={styles.statLabel}>Produtos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {estatisticas.movimentacoes}
                </Text>
                <Text style={styles.statLabel}>Movimentações</Text>
              </View>
            </View>

            {tamanhoArmazenamento > 500 && (
              <View style={styles.warningBox}>
                <Text style={[styles.warningText, { color: colors.warning }]}>
                  ⚠️ Seu armazenamento está ficando grande. Considere limpar
                  dados antigos.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Preferências */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎛️ Preferências</Text>

          <View style={styles.preferenceCard}>
            <View style={styles.preferenceRow}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceTitle}>Manter Histórico</Text>
                <Text style={styles.preferenceDescription}>
                  Guardar histórico de movimentações de estoque
                </Text>
              </View>
              <Switch
                value={configuracoes.manterMovimentacoes}
                onValueChange={(value) =>
                  salvarConfiguracoes({
                    ...configuracoes,
                    manterMovimentacoes: value,
                  })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.card}
              />
            </View>
          </View>
        </View>

        {/* Segurança */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔐 Segurança</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={authAtiva ? handleDesativarPIN : handleConfigurarPIN}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>🔒</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                {authAtiva ? 'Desativar PIN' : 'Configurar PIN'}
              </Text>
              <Text style={styles.actionDescription}>
                {authAtiva
                  ? 'Remover proteção por PIN'
                  : 'Proteja seus dados com um PIN de 4 dígitos'}
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          {authAtiva && (
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleConfigurarPIN}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
                <Text style={styles.actionIconText}>🔑</Text>
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Alterar PIN</Text>
                <Text style={styles.actionDescription}>
                  Trocar o PIN de acesso
                </Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleResetarOnboarding}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>🎓</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ver Tutorial Novamente</Text>
              <Text style={styles.actionDescription}>
                Resetar e ver a tela de boas-vindas
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Limpeza de Dados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🗑️ Limpeza de Dados</Text>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={limparMovimentacoesAntigas}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>🧹</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Limpar Movimentações Antigas
              </Text>
              <Text style={styles.actionDescription}>
                Remove movimentações com mais de {configuracoes.diasRetencao}{" "}
                dias
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={limparComprasPagas}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardSuccess : '#E8F5E9' }]}>
              <Text style={styles.actionIconText}>📦</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Arquivar Compras Pagas</Text>
              <Text style={styles.actionDescription}>
                Move compras pagas para arquivo separado
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={restaurarComprasArquivadas}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardInfo : '#E3F2FD' }]}>
              <Text style={styles.actionIconText}>↩️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Restaurar Compras Arquivadas
              </Text>
              <Text style={styles.actionDescription}>
                Traz de volta compras que foram arquivadas
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Zona de Perigo */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.danger }]}>
            ⚠️ Zona de Perigo
          </Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.dangerCard]}
            onPress={limparTodosOsDados}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? colors.cardDanger : '#FFEBEE' }]}>
              <Text style={styles.actionIconText}>🗑️</Text>
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: colors.danger }]}>
                Apagar Todos os Dados
              </Text>
              <Text style={styles.actionDescription}>
                Remove permanentemente todos os dados do app
              </Text>
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
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
      fontWeight: "500",
    },
    titulo: {
      fontSize: 28,
      fontWeight: "700",
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
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
    },
    storageCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    storageHeader: {
      alignItems: "center",
      marginBottom: 20,
    },
    storageSize: {
      fontSize: 36,
      fontWeight: "700",
    },
    storageLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 16,
    },
    statItem: {
      flex: 1,
      minWidth: "45%",
      alignItems: "center",
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700",
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    warningBox: {
      backgroundColor: colors.cardWarning,
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
    },
    warningText: {
      fontSize: 13,
      lineHeight: 18,
    },
    preferenceCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    preferenceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    preferenceInfo: {
      flex: 1,
      marginRight: 16,
    },
    preferenceTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    preferenceDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    actionCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    dangerCard: {
      borderWidth: 2,
      borderColor: isDark ? colors.cardDanger : '#FFEBEE',
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
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
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    actionArrow: {
      fontSize: 28,
      color: colors.border,
      fontWeight: "300",
    },
  });
}