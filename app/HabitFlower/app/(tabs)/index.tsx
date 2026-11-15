import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  LayoutChangeEvent,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import SeedlingSvg from "../../assets/images/sprites/0.svg";

import { useAppStore } from "@/store/app-store";
import {
  checklistItems,
  countTarget,
  dateKey,
  dayName,
  daysCompleted,
  entryFraction,
  weekDates,
} from "@/lib/habits";

function formatTimesByDay(map?: Record<string, number | undefined>) {
  if (!map) return null;
  return Object.entries(map)
    .map(([k, v]) => `${k}: ${v}x`)
    .join(", ");
}

function ContributionGraph({
  fractions,
  tint,
  isLight,
  labelColor,
}: {
  /** 7 completion fractions (0..1), Sun..Sat of the current week */
  fractions: number[];
  tint: string;
  isLight: boolean;
  labelColor?: string;
}) {
  const COLS = 7;

  const [cellWidth, setCellWidth] = useState(0);
  const gap = 8;

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    const cw = Math.floor((width - (COLS - 1) * gap) / COLS);
    const final = Math.max(24, Math.min(cw, 64));
    setCellWidth(final);
  }, []);

  const cellHeight = Math.max(18, Math.floor(cellWidth * 0.5));
  const borderRadius = Math.floor(cellHeight / 2);

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date().getDay();

  function contrastColor(hex: string) {
    if (!hex) return isLight ? "rgba(0,0,0,0.85)" : "#FFFFFF";
    const h = hex.replace("#", "");
    const r = parseInt(h.length === 3 ? h[0] + h[0] : h.slice(0, 2), 16);
    const g = parseInt(h.length === 3 ? h[1] + h[1] : h.slice(2, 4), 16);
    const b = parseInt(h.length === 3 ? h[2] + h[2] : h.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  }

  return (
    <View
      style={styles.graphContainer}
      onLayout={onLayout}
    >
      <View style={styles.labelsRow}>
        {Array.from({ length: COLS }).map((_, c) => {
          const isTodayLabel = c === today;
          return (
            <View
              key={c}
              style={{
                width: cellWidth || 28,
                marginRight: c === COLS - 1 ? 0 : gap,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    fontWeight: isTodayLabel ? "700" : "400",
                    color: isTodayLabel
                      ? tint
                      : labelColor
                        ? labelColor
                        : isLight
                          ? "rgba(0,0,0,0.68)"
                          : "rgba(255,255,255,0.85)",
                  }}
                >
                  {DAYS[c]}
                </Text>
                {isTodayLabel && (
                  <FontAwesome6
                    name="chevron-down"
                    size={10}
                    color={tint}
                    iconStyle="solid"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.graphRow}>
        {Array.from({ length: COLS }).map((_, c) => {
          const f = Math.max(0, Math.min(1, fractions[c] ?? 0));
          const isTodayCell = c === today;
          let bw = 0;
          let padding = 0;
          let opacity = 0;

          if (isTodayCell) {
            // Always outline today's cell; fill only when there's progress
            bw = 1;
            padding = Math.ceil(bw / 2);
            opacity = f > 0 ? 0.2 + f * 0.8 : 0;
          } else {
            opacity = f > 0 ? 0.2 + f * 0.8 : isLight ? 0.06 : 0.04;
          }
          return (
            <View
              key={c}
              style={{
                width: cellWidth,
                height: cellHeight,
                marginRight: c === COLS - 1 ? 0 : gap,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: cellWidth,
                  height: cellHeight,
                  borderRadius: borderRadius,
                  borderWidth: bw,
                  borderColor: bw > 0 ? tint : undefined,
                  padding,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: Math.max(0, borderRadius - padding),
                    backgroundColor: tint,
                    opacity,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HabitsScreen() {
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const now = new Date();
  const weekday = now.toLocaleDateString(undefined, { weekday: "short" });
  const month = now.toLocaleDateString(undefined, { month: "short" });
  const day = now.getDate();
  const dateLabel = `${weekday} ${day} ${month}`;
  const isLight = background === "#FEF3FF";
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)";
  const [showUpcoming, setShowUpcoming] = useState(false);
  const { data, setHabitEntry } = useAppStore();
  const todayKey = dateKey(now);
  const todayDayName = dayName(now);
  const week = weekDates(now);

  const toggleTask = (habitId: string, task: string) => {
    setHabitEntry(habitId, todayKey, (e) => ({
      ...e,
      tasks: { ...e.tasks, [task]: !e.tasks?.[task] },
    }));
  };

  const toggleChecked = (habitId: string) => {
    setHabitEntry(habitId, todayKey, (e) => ({ ...e, done: !e.done }));
  };

  const incCount = (habitId: string, target: number) => {
    setHabitEntry(habitId, todayKey, (e) => ({
      ...e,
      count: Math.min((e.count ?? 0) + 1, target),
    }));
  };

  const decCount = (habitId: string) => {
    setHabitEntry(habitId, todayKey, (e) => ({
      ...e,
      count: Math.max(0, (e.count ?? 0) - 1),
    }));
  };

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
          <Text style={[styles.title, { color: textColor }]}>My Habits</Text>
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
              onPress={() => setShowUpcoming(false)}
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                !showUpcoming
                  ? { backgroundColor: tint, borderColor: tint }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "rgba(0,0,0,0.2)",
                    },
              ]}
            >
              <FontAwesome6
                name="calendar-day"
                size={12}
                color={!showUpcoming ? "white" : textColor}
                iconStyle="solid"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: !showUpcoming ? "white" : textColor,
                  fontWeight: !showUpcoming ? "700" : "600",
                }}
              >
                Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowUpcoming(true)}
              activeOpacity={0.8}
              style={[
                styles.tabButton,
                showUpcoming
                  ? { backgroundColor: tint, borderColor: tint }
                  : {
                      backgroundColor: "transparent",
                      borderColor: "rgba(0,0,0,0.2)",
                    },
              ]}
            >
              <FontAwesome6
                name="calendar"
                size={12}
                color={showUpcoming ? "white" : textColor}
                iconStyle="solid"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: showUpcoming ? "white" : textColor,
                  fontWeight: showUpcoming ? "700" : "600",
                }}
              >
                Upcoming
              </Text>
            </TouchableOpacity>
          </View>
          {data.habits.map((h) => {
            // Today and Upcoming currently show all habits (scheduling TBD)
            const habitColor = h.color;
            const entries = data.habitLog[h.id];
            const todayEntry = entries?.[todayKey] ?? {};
            const fractions = week.map((d) =>
              entryFraction(h, entries?.[dateKey(d)], dayName(d)),
            );
            const plantLevel = daysCompleted(h, entries);
            const plantLevelLabel =
              plantLevel % 1 === 0 ? `${plantLevel}` : plantLevel.toFixed(1);
            const todayTarget = countTarget(h, todayDayName);
            const todayTasks =
              h.type === "checklist" ? checklistItems(h, todayDayName) : [];
            const isTaskChecked = (t: string) => !!todayEntry.tasks?.[t];

            return (
              <View
                key={h.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <ContributionGraph
                  fractions={fractions}
                  tint={habitColor}
                  isLight={isLight}
                  labelColor={textColor}
                />

                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={styles.iconBox}>
                      <SeedlingSvg
                        width={28}
                        height={28}
                      />
                    </View>
                    <View>
                      <Text style={[styles.cardTitle, { color: textColor }]}>
                        {h.title}
                      </Text>
                      <Text style={[styles.levelLabel, { color: textColor }]}>
                        {plantLevelLabel} days completed
                      </Text>
                      {h.type === "count" ? (
                        <>
                          <Text
                            style={[styles.cardSubtitle, { color: textColor }]}
                          >
                            {h.daysPerWeek ?? 0} days / week
                          </Text>
                          {h.timesByDay ? (
                            <Text
                              style={[
                                styles.cardSubtitleSmall,
                                { color: textColor },
                              ]}
                            >
                              {formatTimesByDay(h.timesByDay)}
                            </Text>
                          ) : (
                            <Text
                              style={[
                                styles.cardSubtitleSmall,
                                { color: textColor },
                              ]}
                            >
                              {(h.target ?? 1) +
                                "x / day (all days)"}
                            </Text>
                          )}
                        </>
                      ) : h.type === "checklist" ? (
                        <Text
                          style={[styles.cardSubtitle, { color: textColor }]}
                        >
                          {h.daysPerWeek ?? 0} days / week
                        </Text>
                      ) : (
                        <Text
                          style={[styles.cardSubtitle, { color: textColor }]}
                        >
                          {h.daysPerWeek ?? 7} days / week
                        </Text>
                      )}
                    </View>
                  </View>
                  {h.type === "count" ? (
                    <View style={styles.counterRow}>
                      {(() => {
                        const cur = todayEntry.count ?? 0;
                        const max = todayTarget;
                        const decDisabled = cur <= 0;
                        const incDisabled =
                          typeof max === "number" ? cur >= max : false;
                        return (
                          <>
                            <TouchableOpacity
                              style={[
                                styles.counterBtn,
                                decDisabled
                                  ? {
                                      borderColor: habitColor,
                                      backgroundColor: "transparent",
                                      borderWidth: 1,
                                    }
                                  : {
                                      backgroundColor: habitColor,
                                      borderWidth: 0,
                                    },
                              ]}
                              onPress={() => decCount(h.id)}
                              disabled={decDisabled}
                            >
                              <FontAwesome6
                                name="minus"
                                size={14}
                                color={decDisabled ? habitColor : "#FFFFFF"}
                                iconStyle="solid"
                              />
                            </TouchableOpacity>

                            <Text
                              style={[
                                styles.counterLabel,
                                { color: textColor },
                              ]}
                            >
                              {" "}
                              {cur}/{todayTarget}
                            </Text>

                            <TouchableOpacity
                              style={[
                                styles.counterBtn,
                                incDisabled
                                  ? {
                                      borderColor: habitColor,
                                      backgroundColor: "transparent",
                                      borderWidth: 1,
                                    }
                                  : {
                                      backgroundColor: habitColor,
                                      borderWidth: 0,
                                    },
                              ]}
                              onPress={() => incCount(h.id, todayTarget)}
                              disabled={incDisabled}
                            >
                              <FontAwesome6
                                name="plus"
                                size={14}
                                color={incDisabled ? habitColor : "#FFFFFF"}
                                iconStyle="solid"
                              />
                            </TouchableOpacity>
                          </>
                        );
                      })()}
                    </View>
                  ) : h.type === "checklist" ? (
                    <Text
                      style={[
                        styles.counterLabel,
                        { color: textColor, opacity: 0.7 },
                      ]}
                    >
                      {todayTasks.length > 0
                        ? `${todayTasks.filter(isTaskChecked).length}/${todayTasks.length}`
                        : "Rest day"}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        todayEntry.done
                          ? { backgroundColor: habitColor }
                          : { borderColor: habitColor, borderWidth: 1 },
                      ]}
                      onPress={() => toggleChecked(h.id)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.checkboxText,
                          todayEntry.done
                            ? { color: "#FFFFFF" }
                            : { color: habitColor },
                        ]}
                      >
                        {todayEntry.done ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Checklist tasks for today */}
                {h.type === "checklist" && todayTasks.length > 0 && (
                  <View style={{ marginTop: 4 }}>
                    {todayTasks.map((task) => {
                      const isChecked = isTaskChecked(task);
                      return (
                        <View
                          key={task}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <TouchableOpacity
                            style={[
                              styles.checkbox,
                              isChecked
                                ? { backgroundColor: habitColor }
                                : { borderColor: habitColor, borderWidth: 1 },
                              { marginRight: 12 },
                            ]}
                            onPress={() => toggleTask(h.id, task)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.checkboxText,
                                isChecked
                                  ? { color: "#FFFFFF" }
                                  : { color: habitColor },
                              ]}
                            >
                              {isChecked ? "✓" : ""}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => toggleTask(h.id, task)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={{
                                color: textColor,
                                fontSize: 15,
                                textDecorationLine: isChecked
                                  ? "line-through"
                                  : "none",
                                opacity: isChecked ? 0.5 : 1,
                              }}
                            >
                              {task}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                {h.type === "checklist" && todayTasks.length === 0 && (
                  <Text
                    style={[
                      styles.cardSubtitleSmall,
                      { color: textColor, marginTop: 4, fontStyle: "italic" },
                    ]}
                  >
                    No tasks scheduled for today
                  </Text>
                )}
              </View>
            );
          })}
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
          onPress={() => Alert.alert("Create Habit", "Placeholder action")}
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
              New Habit
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
  createButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  createButtonText: { fontSize: 14, fontWeight: "700" },
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
  cardSubtitle: { fontSize: 12, opacity: 0.8 },
  graphScroll: { paddingVertical: 4 },
  graphContainer: { width: "100%", marginBottom: 8 },
  labelsRow: { flexDirection: "row", marginBottom: 4 },
  graphColumnWrap: { flexDirection: "column" },
  graphRow: { flexDirection: "row" },
  graph: { flexDirection: "row", flexWrap: "wrap", width: "100%" },
  graphCell: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },
  scroll: { flex: 1 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: { fontSize: 30 },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxText: { fontSize: 16, fontWeight: "700" },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 6,
  },
  counterLabel: { fontSize: 14, fontWeight: "700" },
  cardSubtitleSmall: { fontSize: 12, opacity: 0.85, marginTop: 2 },
  levelLabel: { fontSize: 12, opacity: 0.9, marginTop: 4, fontWeight: "600" },
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
