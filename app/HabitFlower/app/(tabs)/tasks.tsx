import React, { useEffect, useRef, useState } from "react";
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

import { useAppStore } from "@/store/app-store";

const COMPLETE_DELAY_MS = 1300;

export default function TodosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const isLight = background === "#FEF3FF";
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)";
  const { data, setTaskDone, toggleSubtask } = useAppStore();
  const [showCompleted, setShowCompleted] = useState(false);
  // Tasks ticked but still blinking before they move to Completed
  const [completing, setCompleting] = useState<Record<string, boolean>>({});
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const blinkAnimations = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    const pending = timeouts.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const blinkValue = (id: string) => {
    if (!blinkAnimations.current[id]) {
      blinkAnimations.current[id] = new Animated.Value(1);
    }
    return blinkAnimations.current[id];
  };

  const stopCompleting = (id: string) => {
    clearTimeout(timeouts.current[id]);
    delete timeouts.current[id];
    blinkValue(id).stopAnimation(() => blinkValue(id).setValue(1));
    setCompleting((c) => {
      const { [id]: _removed, ...rest } = c;
      return rest;
    });
  };

  const toggleTodo = (id: string, done: boolean) => {
    if (done) {
      // From Completed back to Pending
      setTaskDone(id, false);
      return;
    }
    if (completing[id]) {
      // Un-ticked during the blink: cancel
      stopCompleting(id);
      return;
    }
    setCompleting((c) => ({ ...c, [id]: true }));
    const anim = blinkValue(id);
    const step = (toValue: number) =>
      Animated.timing(anim, { toValue, duration: 150, useNativeDriver: false });
    Animated.sequence([step(0.3), step(1), step(0.3), step(1), step(0.3), step(1)]).start();
    timeouts.current[id] = setTimeout(() => {
      setTaskDone(id, true);
      delete timeouts.current[id];
      setCompleting((c) => {
        const { [id]: _removed, ...rest } = c;
        return rest;
      });
    }, COMPLETE_DELAY_MS);
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
            const pending = data.tasks.filter((t) => !t.done);
            const completed = data.tasks.filter((t) => t.done);
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
              const checked = t.done || !!completing[t.id];
              const opacityValue = blinkAnimations.current[t.id] ?? 1;
              return (
                <Animated.View
                  key={t.id}
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
                              textDecorationLine: checked
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
                        checked
                          ? { backgroundColor: tint }
                          : { borderColor: tint, borderWidth: 1 },
                      ]}
                      onPress={() => toggleTodo(t.id, t.done)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.checkboxText,
                          checked ? { color: "#FFFFFF" } : { color: tint },
                        ]}
                      >
                        {checked ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {t.subtasks.length > 0 && (
                    <View style={{ marginTop: 8 }}>
                      {t.subtasks.map((it) => {
                        const checkedItem = it.done;
                        return (
                          <View
                            key={it.id}
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
                              onPress={() => toggleSubtask(t.id, it.id)}
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
                              onPress={() => toggleSubtask(t.id, it.id)}
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
                                {it.text}
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
