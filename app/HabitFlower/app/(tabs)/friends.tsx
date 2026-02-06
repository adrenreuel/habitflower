import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/use-theme-color";

const FRIENDS = ["Alice", "Bob", "Carlos", "Dana", "Eve"];
const ACTIVITY = [
  "Alice liked your habit",
  "Bob completed a streak",
  "Carlos commented on your post",
  "Dana started a new habit",
  "Eve sent a request",
];

export default function FriendsScreen() {
  const background = useThemeColor({}, "background");

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Text style={styles.title}>Friends</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {FRIENDS.map((name) => (
          <View key={name} style={styles.friendCard}>
            <View style={styles.avatar} />
            <Text style={styles.friendName}>{name}</Text>
            <Text style={styles.friendMeta}>5 habits</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Activity</Text>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.activityList}>
        {ACTIVITY.map((text, idx) => (
          <View key={idx} style={styles.activityCard}>
            <Text style={styles.activityText}>{text}</Text>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  horizontalList: {
    paddingHorizontal: 4,
  },
  friendCard: {
    width: 140,
    height: 160,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginRight: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ddd",
    marginBottom: 12,
  },
  friendName: { fontSize: 16, fontWeight: "600" },
  friendMeta: { fontSize: 12, color: "#666", marginTop: 6 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  activityList: { marginTop: 8 },
  activityCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    marginBottom: 10,
  },
  activityText: { fontSize: 14 },
  activityTime: { fontSize: 12, color: "#666", marginTop: 6 },
});
