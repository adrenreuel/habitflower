import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";

const FRIENDS = ["Batman", "Superman", "Wonder Woman", "Flash", "Aquaman"];
const ACTIVITY = [
  "Batman liked your habit",
  "Superman completed a streak",
  "Wonder Woman commented on your post",
  "Flash started a new habit",
  "Aquaman sent a request",
];
function toUsername(name: string) {
  return name.toLowerCase().replace(/\s+/g, "");
}

export default function FriendsScreen() {
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const iconColor = useThemeColor({}, "icon");
  const isLight = background === "#FEF3FF";
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)";

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: background }]}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: textColor }]}>Friends</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tint }]}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Add Friend", "Placeholder action")}
          >
            <Text style={[styles.addButtonText, { color: background }]}>
              + Add
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {FRIENDS.map((name) => {
            const username = toUsername(name);
            return (
              <View
                key={name}
                style={[styles.friendCard, { backgroundColor: cardBg }]}
              >
                <View style={styles.avatar} />
                <Text style={[styles.friendName, { color: textColor }]}>
                  {username}
                </Text>
                <Text style={[styles.friendMeta, { color: iconColor }]}>
                  5 habits
                </Text>
              </View>
            );
          })}
        </ScrollView>

        <Text style={[styles.title, { color: textColor, fontSize: 20 }]}>
          Activity
        </Text>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.activityList}
        >
          {ACTIVITY.map((text, idx) => {
            const actor = FRIENDS.find((f) => text.includes(f));
            const username = actor ? toUsername(actor) : null;
            const display = username
              ? text.replace(actor as string, username)
              : text;
            return (
              <View
                key={idx}
                style={[styles.activityCard, { backgroundColor: cardBg }]}
              >
                <Text style={[styles.activityText, { color: textColor }]}>
                  {display}
                </Text>
                <Text style={[styles.activityTime, { color: iconColor }]}>
                  2h ago
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16, paddingBottom: 0, marginBottom: 0 },
  title: { fontSize: 28, fontWeight: "700" },
  horizontalList: { paddingHorizontal: 4 },
  friendCard: {
    width: 140,
    height: 160,
    borderRadius: 12,
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
  friendName: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  friendMeta: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  activityList: { marginTop: 8 },
  activityCard: { padding: 12, borderRadius: 12, marginBottom: 12 },
  activityText: { fontSize: 14 },
  activityTime: { fontSize: 12, marginTop: 6 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { fontSize: 14, fontWeight: "700" },
});
