
// components/ClienteCard.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Cliente } from '../types';

type ClienteCardProps = {
  cliente: Cliente;
  totalDevido: number;
  onPress: () => void;
  onLongPress: () => void;
};

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, totalDevido, onPress, onLongPress }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.nome}>{cliente.nome}</Text>
        {cliente.telefone && <Text style={styles.telefone}>{cliente.telefone}</Text>}
      </View>
      <View style={styles.dividaContainer}>
        <Text style={styles.dividaLabel}>Dívida</Text>
        <Text style={[styles.dividaValor, totalDevido > 0 ? styles.comDivida : styles.semDivida]}>
          {totalDevido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

function createStyles(colors: any, isDark: boolean) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 6,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    infoContainer: {
      flex: 1,
    },
    nome: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.text,
    },
    telefone: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    dividaContainer: {
      alignItems: 'flex-end',
    },
    dividaLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    dividaValor: {
      fontSize: 16,
      fontWeight: '700',
    },
    comDivida: {
      color: colors.danger,
    },
    semDivida: {
      color: colors.success,
    },
  });
}

export default ClienteCard;
