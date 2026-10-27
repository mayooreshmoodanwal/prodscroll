import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../src/context";
const icons = {
  index: "home-outline",
  explore: "compass-outline",
  create: "add-circle-outline",
  messages: "chatbubble-outline",
  profile: "person-outline",
} as const;
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.paper },
        headerTitleStyle: {
          fontSize: 22,
          fontWeight: "600",
          letterSpacing: -0.6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={icons[route.name as keyof typeof icons] || "ellipse-outline"}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "productscroll.", tabBarLabel: "Home" }}
      />
      <Tabs.Screen name="explore" options={{ title: "Explore" }} />
      <Tabs.Screen
        name="create"
        options={{ title: "What are you building?", tabBarLabel: "Create" }}
      />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen
        name="profile"
        options={{ title: "Your space", tabBarLabel: "Profile" }}
      />
    </Tabs>
  );
}
