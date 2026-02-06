import { StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function SettingsScreen() {
  const background = useThemeColor({}, "background");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={styles.title}>Settings</Text>
      <Text>App settings go here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  title: { fontSize: 24, marginBottom: 8 },
});
