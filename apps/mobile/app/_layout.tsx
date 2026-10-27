import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, colors } from "../src/context";
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.paper },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="startup/[slug]"
          options={{ title: "The startup" }}
        />
        <Stack.Screen
          name="profile/[username]"
          options={{ title: "The builder" }}
        />
        <Stack.Screen name="reels" options={{ title: "Ideas in motion" }} />
        <Stack.Screen name="product/[slug]" options={{ title: "The product" }} />
        <Stack.Screen
          name="notifications"
          options={{ title: "Your community" }}
        />
        <Stack.Screen name="saved" options={{ title: "Your saved ideas" }} />
      </Stack>
    </AuthProvider>
  );
}
