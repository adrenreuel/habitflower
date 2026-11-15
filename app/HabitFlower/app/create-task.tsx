import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useThemeColor } from "@/hooks/use-theme-color";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";
import { useRouter } from "expo-router";
import { useAppStore } from "@/store/app-store";

export default function CreateTaskScreen() {
  const router = useRouter();
  const { addTask } = useAppStore();
  const insets = useSafeAreaInsets();
  const background = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const tint = useThemeColor({}, "tint");
  const isLight = background === "#FEF3FF";
  const cardBg = isLight ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.06)";
  const borderColor = isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateEnabled, setDateEnabled] = useState(false);
  const [timeEnabled, setTimeEnabled] = useState(false);
  const [subtaskInputs, setSubtaskInputs] = useState<string[]>([]);

  const handleCancel = () => {
    router.back();
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    // Filter out empty subtasks
    const validSubtasks = subtaskInputs.filter((s) => s.trim());

    // Create the new todo
    const newTodo = {
      title: title.trim(),
      description: description.trim() || undefined,
      datetime: selectedDate
        ? new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            selectedTime ? parseInt(selectedTime.split(":")[0]) : 0,
            selectedTime ? parseInt(selectedTime.split(":")[1]) : 0,
          ).toISOString()
        : undefined,
      subtasks: validSubtasks.length > 0 ? validSubtasks : undefined,
    };

    addTask(newTodo);

    // Navigate back
    router.back();
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "Select date";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTimeDisplay = (timeString: string | null) => {
    if (!timeString) return "Select time";
    return timeString;
  };

  const addSubtask = () => {
    setSubtaskInputs([...subtaskInputs, ""]);
  };

  const deleteSubtask = (index: number) => {
    setSubtaskInputs(subtaskInputs.filter((_, i) => i !== index));
  };

  const updateSubtask = (index: number, value: string) => {
    const newInputs = [...subtaskInputs];
    newInputs[index] = value;
    setSubtaskInputs(newInputs);
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[styles.safeArea, { backgroundColor: background }]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerButton, { color: textColor }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            New Task
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.headerButton, { color: tint, fontWeight: "700" }]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Title Input */}
            <View style={styles.section}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: cardBg,
                    color: textColor,
                    borderColor: borderColor,
                  },
                ]}
                placeholder="What's the task?"
                placeholderTextColor={`${textColor}80`}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
            </View>

            {/* Notes Input */}
            <View style={styles.section}>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: cardBg,
                    color: textColor,
                    borderColor: borderColor,
                  },
                ]}
                placeholder="Optional notes"
                placeholderTextColor={`${textColor}80`}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            {/* Date Selection Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <View style={styles.sectionHeaderWithToggle}>
                <Text style={[styles.sectionLabel, { color: textColor }]}>
                  Date
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    dateEnabled
                      ? { backgroundColor: tint }
                      : { backgroundColor: "rgba(0,0,0,0.2)" },
                  ]}
                  onPress={() => {
                    const newDateEnabled = !dateEnabled;
                    setDateEnabled(newDateEnabled);
                    if (!newDateEnabled) {
                      // Disable time if we're disabling date
                      setTimeEnabled(false);
                      setSelectedDate(null);
                      setSelectedTime(null);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                    } else {
                      setSelectedDate(null);
                      setShowDatePicker(false);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      dateEnabled ? styles.toggleCircleActive : {},
                    ]}
                  />
                </TouchableOpacity>
              </View>
              {dateEnabled && (
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    {
                      backgroundColor: isLight
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(255,255,255,0.1)",
                      borderColor: borderColor,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.8}
                >
                  <FontAwesome6
                    name="calendar"
                    size={16}
                    color={tint}
                    iconStyle="solid"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.pickerButtonText, { color: textColor }]}>
                    {formatDateDisplay(selectedDate)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Date Picker */}
              {showDatePicker && Platform.OS === "ios" && (
                <View
                  style={[
                    styles.datePickerContainer,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <View
                    style={[
                      styles.datePickerHeader,
                      { borderBottomColor: borderColor },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.headerButton, { color: tint }]}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                    textColor={textColor}
                  />
                </View>
              )}
              {showDatePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    if (date) {
                      setSelectedDate(date);
                      setShowDatePicker(false);
                    }
                  }}
                />
              )}
            </View>

            {/* Time Selection Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <View style={styles.sectionHeaderWithToggle}>
                <Text style={[styles.sectionLabel, { color: textColor }]}>
                  Time
                </Text>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    timeEnabled
                      ? { backgroundColor: tint }
                      : { backgroundColor: "rgba(0,0,0,0.2)" },
                  ]}
                  onPress={() => {
                    const newTimeEnabled = !timeEnabled;
                    setTimeEnabled(newTimeEnabled);
                    if (newTimeEnabled) {
                      // Enable date if we're enabling time
                      setDateEnabled(true);
                      setSelectedTime(null);
                      setShowTimePicker(false);
                    } else {
                      setSelectedTime(null);
                      setShowTimePicker(false);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      timeEnabled ? styles.toggleCircleActive : {},
                    ]}
                  />
                </TouchableOpacity>
              </View>
              {timeEnabled && (
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    {
                      backgroundColor: isLight
                        ? "rgba(255,255,255,0.5)"
                        : "rgba(255,255,255,0.1)",
                      borderColor: borderColor,
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                  activeOpacity={0.8}
                >
                  <FontAwesome6
                    name="clock"
                    size={16}
                    color={tint}
                    iconStyle="solid"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.pickerButtonText, { color: textColor }]}>
                    {formatTimeDisplay(selectedTime)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Time Picker */}
              {showTimePicker && Platform.OS === "ios" && (
                <View
                  style={[
                    styles.datePickerContainer,
                    { backgroundColor: cardBg, borderColor: borderColor },
                  ]}
                >
                  <View
                    style={[
                      styles.datePickerHeader,
                      { borderBottomColor: borderColor },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setShowTimePicker(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.headerButton, { color: tint }]}>
                        Done
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={
                      selectedTime
                        ? new Date(
                            1970,
                            0,
                            1,
                            parseInt(selectedTime.split(":")[0]),
                            parseInt(selectedTime.split(":")[1]),
                          )
                        : new Date(1970, 0, 1, 0, 0)
                    }
                    mode="time"
                    display="spinner"
                    onChange={(event, date) => {
                      if (date) {
                        const hours = String(date.getHours()).padStart(2, "0");
                        const minutes = String(date.getMinutes()).padStart(
                          2,
                          "0",
                        );
                        setSelectedTime(`${hours}:${minutes}`);
                      }
                    }}
                    textColor={textColor}
                  />
                </View>
              )}
              {showTimePicker && Platform.OS === "android" && (
                <DateTimePicker
                  value={
                    selectedTime
                      ? new Date(
                          1970,
                          0,
                          1,
                          parseInt(selectedTime.split(":")[0]),
                          parseInt(selectedTime.split(":")[1]),
                        )
                      : new Date(1970, 0, 1, 0, 0)
                  }
                  mode="time"
                  display="default"
                  onChange={(event, date) => {
                    if (date) {
                      const hours = String(date.getHours()).padStart(2, "0");
                      const minutes = String(date.getMinutes()).padStart(
                        2,
                        "0",
                      );
                      setSelectedTime(`${hours}:${minutes}`);
                      setShowTimePicker(false);
                    }
                  }}
                />
              )}
            </View>

            {/* Subtasks Section */}
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderColor },
              ]}
            >
              <Text style={[styles.sectionLabel, { color: textColor }]}>
                Subtasks (optional)
              </Text>
              {subtaskInputs.map((subtask, index) => (
                <View
                  key={index}
                  style={styles.subtaskRow}
                >
                  <TextInput
                    style={[
                      styles.subtaskInput,
                      {
                        backgroundColor: isLight
                          ? "rgba(255,255,255,0.5)"
                          : "rgba(255,255,255,0.1)",
                        color: textColor,
                        borderColor: borderColor,
                      },
                    ]}
                    placeholder="Enter subtask"
                    placeholderTextColor={`${textColor}80`}
                    value={subtask}
                    onChangeText={(value) => updateSubtask(index, value)}
                    maxLength={100}
                  />
                  <TouchableOpacity
                    onPress={() => deleteSubtask(index)}
                    activeOpacity={0.7}
                    style={styles.deleteSubtaskButton}
                  >
                    <FontAwesome6
                      name="trash"
                      size={14}
                      color="#FF6B6B"
                      iconStyle="solid"
                    />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[
                  styles.addSubtaskButton,
                  {
                    backgroundColor: isLight
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.1)",
                    borderColor: borderColor,
                  },
                ]}
                onPress={addSubtask}
                activeOpacity={0.8}
              >
                <FontAwesome6
                  name="plus"
                  size={14}
                  color={tint}
                  iconStyle="solid"
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.addSubtaskText, { color: tint }]}>
                  Add subtask
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  section: {
    marginTop: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    opacity: 0.9,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    paddingVertical: 12,
    paddingTop: 12,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  datePickerContainer: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionHeaderWithToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
  },
  toggleCircleActive: {
    alignSelf: "flex-end",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  deleteSubtaskButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addSubtaskButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
  },
  addSubtaskText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
