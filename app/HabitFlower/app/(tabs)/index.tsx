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

type Habit = {
  title: string;
  type?: "count";
  target?: number;
  daysPerWeek?: number;
  timesPerDay?: number;
  timesByDay?: Record<string, number>;
};

type Todo = {
  title: string;
  datetime?: string; // ISO string
  sublist?: string[];
  description?: string;
};

const HABITS: Habit[] = [
  // simple checkbox habit
  { title: "Hit the gym" },

  // count-based habit: uniform times per day (example: 3x/day, every day)
  {
    title: "Push-ups",
    type: "count",
    target: 3,
    daysPerWeek: 7,
    timesPerDay: 3,
  },

  // count-based habit: different counts for specific days
  {
    title: "Practice scales",
    type: "count",
    target: 3,
    daysPerWeek: 5,
    timesByDay: { Mon: 2, Wed: 3, Fri: 1 },
  },
];

// Per-habit colors (used for chart and checkbox)
const HABIT_COLORS = ["#6B3F69", "#4BAF17", "#FFB020", "#3B82F6"];

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

function randomLevels(days = 28) {
  return Array.from({ length: days }, (_, i) =>
    i % 5 === 0 ? 0 : (i % 4) + 1,
  );
}

function emojiForTitle(title: string) {
  const t = title.toLowerCase();
  return "🌱";
}

function formatTimesByDay(map?: Record<string, number>) {
  if (!map) return null;
  return Object.entries(map)
    .map(([k, v]) => `${k}: ${v}x`)
    .join(", ");
}

function ContributionGraph({
  levels,
  tint,
  isLight,
  labelColor,
  todayFraction,
}: {
  levels?: number[];
  tint: string;
  isLight: boolean;
  labelColor?: string;
  // optional fraction 0..1 to indicate today's completion (overrides today's cell opacity)
  todayFraction?: number;
}) {
  const ROWS = 1;
  const COLS = 7;
  const total = ROWS * COLS;
  const data =
    levels && levels.length >= total
      ? levels.slice(0, total)
      : randomLevels(total);

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
          const idx = c;
          const lvl = data[idx] ?? 0;
          const isTodayCell = c === today;
          const bw = isTodayCell ? 1 : 0;
          const padding = isTodayCell ? Math.ceil(bw / 2) : 0;
          let opacity = lvl === 0 ? (isLight ? 0.06 : 0.04) : 0.2 + lvl * 0.16;
          if (isTodayCell && typeof todayFraction === "number") {
            const f = Math.max(0, Math.min(1, todayFraction));
            opacity = 0.2 + f * 0.8; // map fraction to visible opacity range
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
                  borderColor: isTodayCell ? tint : undefined,
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [todosChecked, setTodosChecked] = useState<Record<string, boolean>>({});
  const [subChecked, setSubChecked] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [showCompleted, setShowCompleted] = useState(false);

  const toggleChecked = (title: string) => {
    setChecked((s) => ({ ...s, [title]: !s[title] }));
  };

  const incCount = (title: string, target?: number) => {
    setCounts((s) => {
      const cur = s[title] ?? 0;
      const next =
        typeof target === "number" ? Math.min(cur + 1, target) : cur + 1;
      return { ...s, [title]: next };
    });
  };

  const decCount = (title: string) => {
    setCounts((s) => {
      const cur = s[title] ?? 0;
      const next = Math.max(0, cur - 1);
      return { ...s, [title]: next };
    });
  };

  const toggleTodo = (title: string) => {
    setTodosChecked((s) => ({ ...s, [title]: !s[title] }));
  };

  const toggleSubItem = (todoTitle: string, item: string) => {
    setSubChecked((s) => {
      const cur = s[todoTitle] ?? {};
      return { ...s, [todoTitle]: { ...cur, [item]: !cur[item] } };
    });
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
          <Text style={[styles.title, { color: textColor }]}>
            My HabitFlowers
          </Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.list]}
          showsVerticalScrollIndicator={false}
        >
          {HABITS.map((h, i) => {
            const emoji = emojiForTitle(h.title);
            const habitColor = HABIT_COLORS[i % HABIT_COLORS.length];
            const levels = randomLevels();
            const plantLevelRaw = levels.reduce((sum, lvl) => {
              const denom = h.target ?? h.timesPerDay ?? 1;
              return sum + Math.min(1, lvl / denom);
            }, 0);
            const plantLevel = Math.round(plantLevelRaw * 10) / 10;
            const plantLevelLabel =
              plantLevel % 1 === 0 ? `${plantLevel}` : plantLevel.toFixed(1);
            // compute today's fraction for coloring today's cell
            let todayFraction: number | undefined;
            if (h.type === "count") {
              const cur = counts[h.title] ?? 0;
              const target =
                typeof h.target === "number" ? h.target : (h.timesPerDay ?? 1);
              if (target > 0 && cur > 0) {
                todayFraction = Math.min(1, cur / target);
              }
            } else {
              if (checked[h.title]) todayFraction = 1;
            }

            return (
              <View
                key={h.title}
                style={[
                  styles.card,
                  {
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <ContributionGraph
                  levels={levels}
                  tint={habitColor}
                  isLight={isLight}
                  labelColor={textColor}
                  todayFraction={todayFraction}
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
                              {(h.timesPerDay ?? h.target) +
                                "x / day (all days)"}
                            </Text>
                          )}
                        </>
                      ) : (
                        <Text
                          style={[styles.cardSubtitle, { color: textColor }]}
                        >
                          3 days / week
                        </Text>
                      )}
                    </View>
                  </View>
                  {h.type === "count" ? (
                    <View style={styles.counterRow}>
                      {(() => {
                        const cur = counts[h.title] ?? 0;
                        const max =
                          typeof h.target === "number" ? h.target : undefined;
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
                              onPress={() => decCount(h.title)}
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
                              {cur}/{h.target ?? 1}
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
                              onPress={() => incCount(h.title, h.target)}
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
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        checked[h.title]
                          ? { backgroundColor: habitColor }
                          : { borderColor: habitColor, borderWidth: 1 },
                      ]}
                      onPress={() => toggleChecked(h.title)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.checkboxText,
                          checked[h.title]
                            ? { color: "#FFFFFF" }
                            : { color: habitColor },
                        ]}
                      >
                        {checked[h.title] ? "✓" : ""}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          <View style={{ height: 8 }} />
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <Text style={[styles.title, { color: textColor, fontSize: 20 }]}>
              To-dos
            </Text>
            <TouchableOpacity
              onPress={() => setShowCompleted((s) => !s)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderRadius: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FontAwesome6
                  name={showCompleted ? "clock" : "circle-check"}
                  size={12}
                  color={tint}
                  iconStyle="solid"
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: tint }}>
                  {showCompleted ? "Show pending" : "Show completed"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {(() => {
            const pending = TODOS.filter((t) => !todosChecked[t.title]);
            const completed = TODOS.filter((t) => !!todosChecked[t.title]);
            const listToShow = showCompleted ? completed : pending;

            if (listToShow.length === 0) {
              const msg = showCompleted
                ? "No completed to-dos"
                : "No pending to-dos";
              return (
                <View style={[styles.card, { backgroundColor: cardBg }]}>
                  <View style={styles.cardHeader}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: "rgba(0,0,0,0.02)" },
                        ]}
                      >
                        <FontAwesome6
                          name="circle-info"
                          size={18}
                          color={tint}
                          iconStyle="solid"
                        />
                      </View>
                      <View style={{ marginLeft: 8 }}>
                        <Text style={[styles.cardTitle, { color: textColor }]}>
                          {msg}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }

            return listToShow.map((t) => {
              const done = !!todosChecked[t.title];
              return (
                <View
                  key={t.title}
                  style={[styles.card, { backgroundColor: cardBg }]}
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
                        <Text style={[styles.cardTitle, { color: textColor }]}>
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
                              <Text style={{ color: textColor, fontSize: 15 }}>
                                {it}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
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
            <Text style={{ color: background, fontWeight: "700" }}>Create</Text>
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
