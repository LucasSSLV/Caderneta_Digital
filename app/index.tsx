import { useRouter } from 'expo-router';
import { Button, Text, View } from "react-native";

export default function Index() {

  const router = useRouter();
  const handleClick = () => {
    console.log("Foi clicado");
  };
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Button title="Go to Tela Inicial" onPress={() => router.push('/TelaInicial')} />
      <Text>Aqui começo a desenvolver meu app caderneta digital</Text>
    </View>
  );
}
