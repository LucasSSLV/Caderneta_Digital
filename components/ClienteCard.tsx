
// components/ClienteCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Cliente } from '../types';

type ClienteCardProps = {
  cliente: Cliente;
  totalDevido: number;
  onPress: () => void;
  onLongPress: () => void;
};

const ClienteCard: React.FC<ClienteCardProps> = ({ cliente, totalDevido, onPress, onLongPress }) => {
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    fontSize: 12,
    color: '#999',
  },
  dividaValor: {
    fontSize: 16,
    fontWeight: '700',
  },
  comDivida: {
    color: '#e53935', // Vermelho
  },
  semDivida: {
    color: '#43a047', // Verde
  },
});

export default ClienteCard;
