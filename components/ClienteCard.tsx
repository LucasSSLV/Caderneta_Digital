
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cliente } from '../types';

interface ClienteCardProps {
  cliente: Cliente;
  totalDevido: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export default function ClienteCard({ cliente, totalDevido, onPress, onLongPress }: ClienteCardProps) {
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.nome}>{cliente.nome}</Text>
        <Text style={styles.telefone}>{cliente.telefone}</Text>
      </View>
      <View style={styles.dividaContainer}>
        <Text style={styles.dividaLabel}>Dívida</Text>
        <Text style={[styles.dividaValor, totalDevido > 0 ? styles.comDivida : styles.semDivida]}>
          {formatarValor(totalDevido)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContainer: {
    flex: 1,
  },
  nome: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  telefone: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dividaContainer: {
    alignItems: 'flex-end',
  },
  dividaLabel: {
    fontSize: 13,
    color: '#666',
  },
  dividaValor: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  comDivida: {
    color: '#e74c3c',
  },
  semDivida: {
    color: '#27ae60',
  },
});
