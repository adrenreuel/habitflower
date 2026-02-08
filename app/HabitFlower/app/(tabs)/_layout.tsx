import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { View } from "react-native";
import { FontAwesome6 } from "@react-native-vector-icons/fontawesome6";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor:
            colorScheme === "dark" ? Colors.dark.background : Colors.light.tint,
          borderTopColor: "transparent",
        },
        tabBarActiveTintColor:
          colorScheme === "dark" ? Colors.dark.tint : Colors.light.background,
        tabBarInactiveTintColor: Colors[colorScheme ?? "light"].tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Overview",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome6
                name="circle-check"
                size={22}
                color={color}
                iconStyle="solid"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "Friends",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome6
                name="people-group"
                size={22}
                color={color}
                iconStyle="solid"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <View
              style={{
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesome6
                name="gear"
                size={22}
                color={color}
                iconStyle="solid"
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
