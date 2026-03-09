import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useRouter } from "expo-router";

type Todo = {
  title: string;
  datetime?: string; // ISO string
  sublist?: string[];
  description?: string;
};

const TODOS: Todo[] = [
  {
    title: "Finish assignment",
    datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    description: "Finish the math assignment before class",
  },
  {
    title: "Grocery run",
    datetime: new Date().toISOString(),
    sublist: ["Milk", "Eggs", "Bread"],
    description: "Quick trip to pick up essentials for the week",
  },
];

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const isLight = background === "#FEF3FF";
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)";
  const [todosChecked, setTodosChecked] = useState<Record<string, boolean>>({});
  const [subChecked, setSubChecked] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [hiddenTodos, setHiddenTodos] = useState<Set<string>>(new Set());
  const [timeoutIds, setTimeoutIds] = useState<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const [blinkAnimations, setBlinkAnimations] = useState<
    Record<string, Animated.Value>
  >({});

  const toggleTodo = (title: string) => {
    setTodosChecked((s) => {
      const newState = { ...s, [title]: !s[title] };

      if (newState[title]) {
        // Marking as complete - start blink animation
        const animValue = new Animated.Value(1);

        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();

        setBlinkAnimations((prev) => ({ ...prev, [title]: animValue }));

        // Set timeout to hide after blinking completes (1.2 seconds for animation + 100ms delay)
        const id = setTimeout(() => {
          setHiddenTodos((prev) => new Set(prev).add(title));
        }, 1300);
        setTimeoutIds((prev) => ({ ...prev, [title]: id }));
      } else {
        // Marking as pending - stop animation and reset opacity
        const animValue = blinkAnimations[title];
        if (animValue) {
          animValue.stopAnimation(() => {
            animValue.setValue(1);
          });
        }

        // Clear timeout so it doesn't hide
        if (timeoutIds[title]) {
          clearTimeout(timeoutIds[title]);
          setTimeoutIds((prev) => {
            const copy = { ...prev };
            delete copy[title];
            return copy;
          });
        }
        setHiddenTodos((prev) => {
          const copy = new Set(prev);
          copy.delete(title);
          return copy;
        });
      }

      return newState;
    });
  };

  const toggleSubItem = (todoTitle: string, item: string) => {
    setSubChecked((s) => {
      const cur = s[todoTitle] ?? {};
      return { ...s, [todoTitle]: { ...cur, [item]: !cur[item] } };
    });
  };

  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "short" });
  const month = now.toLocaleDateString(undefined, { month: "short" });
  const day = now.getDate();
  const dateLabel = `${weekday} ${day} ${month}`;

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: background }]}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.dateLabel, { color: textColor }]}>
            {" "}
            {dateLabel}{" "}
          </Text>
          <Text style={[styles.title, { color: textColor }]}>My Tasks</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 96 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              flexDirection: "row",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => setShowCompleted(false)}
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                !showCompleted
                  ? { backgroundColor: tint, borderColor: tint }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "rgba(0,0,0,0.2)",
                    },
              ]}
            >
              <FontAwesome6
                name="circle-check"
                size={12}
                color={!showCompleted ? "white" : textColor}
                iconStyle="solid"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: !showCompleted ? "white" : textColor,
                  fontWeight: !showCompleted ? "700" : "600",
                }}
              >
                Pending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowCompleted(true)}
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                showCompleted
                  ? { backgroundColor: tint, borderColor: tint }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "rgba(0,0,0,0.2)",
                    },
              ]}
            >
              <FontAwesome6
                name="circle-check"
                size={12}
                color={showCompleted ? "white" : textColor}
                iconStyle="solid"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: showCompleted ? "white" : textColor,
                  fontWeight: showCompleted ? "700" : "600",
                }}
              >
                Completed
              </Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const pending = TODOS.filter((t) => !hiddenTodos.has(t.title));
            const completed = TODOS.filter((t) => !!todosChecked[t.title]);
            const listToShow = showCompleted ? completed : pending;

            if (listToShow.length === 0) {
              const msg = showCompleted
                ? "No completed tasks"
                : "No pending tasks";
              return (
                <View style={styles.emptyStateContainer}>
                  <FontAwesome6
                    name="inbox"
                    size={48}
                    color={tint}
                    iconStyle="solid"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "600",
                      color: textColor,
                      textAlign: "center",
                    }}
                  >
                    {msg}
                  </Text>
                </View>
              );
            }

            return listToShow.map((t) => {
              const done = !!todosChecked[t.title];
              const opacityValue = blinkAnimations[t.title] || 1;
              return (
                <Animated.View
                  key={t.title}
                  style={[
                    styles.card,
                    { backgroundColor: cardBg, opacity: opacityValue },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flex: 1,
                      }}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: "rgba(0,0,0,0.04)" },
                        ]}
                      >
                        <FontAwesome6
                          name="clipboard"
                          size={18}
                          color={tint}
                          iconStyle="solid"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.cardTitle,
                            {
                              color: textColor,
                              textDecorationLine: done
                                ? "line-through"
                                : "none",
                            },
                          ]}
                        >
                          {" "}
                          {t.title}{" "}
                        </Text>
                        {t.datetime && (
                          <Text
                            style={[
                              styles.cardSubtitleSmall,
                              { color: textColor },
                            ]}
                          >
                            {new Date(t.datetime).toLocaleString()}
                          </Text>
                        )}
                        {t.description && (
                          <Text
                            style={[
                              styles.cardSubtitleSmall,
                              { color: textColor, marginTop: 4 },
                            ]}
                          >
                            {t.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        done
                          ? { backgroundColor: tint }
                          : { borderColor: tint, borderWidth: 1 },
                      ]}
                      onPress={() => toggleTodo(t.title)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.checkboxText,
                          done ? { color: "#FFFFFF" } : { color: tint },
                        ]}
                      >
                        {done ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {t.sublist && (
                    <View style={{ marginTop: 8 }}>
                      {t.sublist.map((it) => {
                        const checkedItem = subChecked[t.title]?.[it];
                        return (
                          <View
                            key={it}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: 8,
                            }}
                          >
                            <TouchableOpacity
                              style={[
                                styles.checkbox,
                                checkedItem
                                  ? { backgroundColor: tint }
                                  : { borderColor: tint, borderWidth: 1 },
                                { marginRight: 12 },
                              ]}
                              onPress={() => toggleSubItem(t.title, it)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.checkboxText,
                                  checkedItem
                                    ? { color: "#FFFFFF", fontSize: 16 }
                                    : { color: tint, fontSize: 16 },
                                ]}
                              >
                                {checkedItem ? "✓" : ""}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => toggleSubItem(t.title, it)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={{
                                  color: textColor,
                                  fontSize: 15,
                                  textDecorationLine: checkedItem
                                    ? "line-through"
                                    : "none",
                                  opacity: checkedItem ? 0.5 : 1,
                                }}
                              >
                                {it}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Animated.View>
              );
            });
          })()}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: tint,
              paddingHorizontal: 14,
              bottom: insets.bottom,
            },
          ]}
          onPress={() => router.push("/create-task")}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <FontAwesome6
              name="plus"
              size={18}
              color={background}
              iconStyle="solid"
              style={{ marginRight: 8 }}
            />
            <Text style={{ color: background, fontWeight: "700" }}>
              New Task
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, padding: 16, paddingBottom: 0, marginBottom: 0 },
  headerRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "700" },
  dateLabel: { fontSize: 14, fontWeight: "600", opacity: 0.9, marginBottom: 4 },
  list: { paddingBottom: 12 },
  card: { borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: { fontSize: 16, fontWeight: "700" },
  cardSubtitleSmall: { fontSize: 12, opacity: 0.85, marginTop: 2 },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 120,
  },
  fab: {
    position: "absolute",
    right: 16,
    minWidth: 56,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
});
