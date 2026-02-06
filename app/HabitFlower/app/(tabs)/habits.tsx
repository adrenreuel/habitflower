import { StyleSheet, Text, View } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HabitsScreen() {
  const background = useThemeColor({}, "background");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={styles.title}>Habits</Text>
      <Text>Your habits will appear here.</Text>
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
