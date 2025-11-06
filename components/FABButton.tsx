// components/FABButton.tsx
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface FABButtonProps {
    onPress: () => void;
    icon?: string;
}

export default function FABButton({ onPress, icon = '+' }: FABButtonProps) {
    return (
        <TouchableOpacity
            style={styles.fab}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={styles.fabText}>{icon}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabText: {
        fontSize: 32,
        color: '#fff',
        fontWeight: '300',
    },
});