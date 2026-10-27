import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Crypto from "expo-crypto";
import { restoreTokens, saveTokens, request, signOut, API_URL } from "./client";
import type { User } from "./types";
interface Context {
  user: User | null;
  setUser: (u: User | null) => void;
  requireAuth: () => boolean;
  logout: () => Promise<void>;
}
const Auth = createContext<Context | null>(null);
import { colors } from "@productscroll/design-tokens";
export { colors };
export function AuthProvider({ children }: { children: ReactNode }) {
  const [google, setGoogle] = useState(false);
  const [user, setUser] = useState<User | null>(null),
    [visible, setVisible] = useState(false),
    [register, setRegister] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [username, setUsername] = useState(""),
    [name, setName] = useState(""),
    [founder, setFounder] = useState(false),
    [busy, setBusy] = useState(false),
    [categories, setCategories] = useState<string[]>([]),
    [interests, setInterests] = useState<string[]>([]);
  useEffect(() => {
    void request<{ google: boolean }>("/auth/providers")
      .then((r) => setGoogle(r.google))
      .catch(() => undefined);
    void restoreTokens()
      .then(() => request<{ user: User }>("/auth/me"))
      .then((r) => setUser(r.user))
      .catch(() => undefined);
    void request<{ items: string[] }>("/categories")
      .then((r) => setCategories(r.items))
      .catch(() => undefined);
  }, []);
  async function login(demo = false) {
    setBusy(true);
    try {
      const result = await request<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>(
        register && !demo ? "/auth/register" : "/auth/login",
        register && !demo
          ? {
              email,
              password,
              username,
              displayName: name,
              role: founder ? "FOUNDER" : "USER",
            }
          : {
              email: demo ? "maya@productscroll.local" : email,
              password: demo ? "BuildSomething!42" : password,
            },
      );
      await saveTokens(result);
      setUser(result.user);
      setVisible(false);
      setPassword("");
      if (register && !demo)
        Alert.alert(
          "Check your email",
          "Verify your email before posting or messaging.",
        );
    } catch (e) {
      Alert.alert("Sign-in problem", (e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function googleSignIn() {
    try {
      const bytes = await Crypto.getRandomBytesAsync(32);
      const verifier = Array.from(bytes, (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const challenge = (
        await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          verifier,
          { encoding: Crypto.CryptoEncoding.BASE64 },
        )
      )
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
      const result = await WebBrowser.openAuthSessionAsync(
        `${API_URL}/auth/google?mobileChallenge=${challenge}`,
        "productscroll://oauth",
      );
      if (result.type !== "success") return;
      const code = new URL(result.url).searchParams.get("code");
      const login = await request<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>("/auth/mobile-exchange", { code, verifier });
      await saveTokens(login);
      setUser(login.user);
      setVisible(false);
    } catch (e) {
      Alert.alert("Sign-in problem", (e as Error).message);
    }
  }
  const logout = async () => {
    await signOut();
    setUser(null);
  };
  return (
    <Auth.Provider
      value={{
        user,
        setUser,
        requireAuth: () => {
          if (user) return true;
          setVisible(true);
          return false;
        },
        logout,
      }}
    >
      {children}
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <SafeAreaView style={styles.page}>
          <ScrollView contentContainerStyle={styles.form}>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              accessibilityLabel="Close sign-in"
            >
              <Text style={styles.link}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {register ? "Stay curious. Join in." : "Good to see you."}
            </Text>
            <Text style={styles.subtitle}>
              Discover the ideas and people building what comes next.
            </Text>
            {register && (
              <>
                <Text>Full name</Text>
                <TextInput
                  accessibilityLabel="Full name"
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
                <Text>Username</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setFounder(!founder)}>
                  <Text style={styles.link}>
                    {founder ? "✓ Founder account" : "I’m a founder or builder"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <Text>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
            />
            <Text>Password</Text>
            <TextInput
              accessibilityLabel="Password"
              secureTextEntry
              style={styles.input}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={() => void login()}
              disabled={busy}
            >
              <Text style={styles.buttonText}>
                {busy ? "One moment…" : register ? "Create account" : "Sign in"}
              </Text>
            </TouchableOpacity>
            {google && (
              <TouchableOpacity onPress={() => void googleSignIn()}>
                <Text style={styles.link}>Continue with Google</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setRegister(!register)}>
              <Text style={styles.link}>
                {register ? "Already a member? Sign in" : "Create an account"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => void login(true)}>
              <Text style={styles.link}>Explore with the demo account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (!email) return Alert.alert("Enter your email first");
                void request("/auth/forgot-password", { email })
                  .then(() =>
                    Alert.alert(
                      "Check your email",
                      "If that account exists, a reset link has been sent.",
                    ),
                  )
                  .catch((e) => Alert.alert("Error", e.message));
              }}
            >
              <Text style={styles.link}>Forgot password?</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={!!user && !user.onboarded} animationType="slide">
        <SafeAreaView style={styles.page}>
          <ScrollView contentContainerStyle={styles.form}>
            <Text style={styles.title}>What sparks your curiosity?</Text>
            <Text style={styles.subtitle}>
              Choose 3–10 interests to get started.
            </Text>
            <View style={styles.chips}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    interests.includes(c) && styles.selected,
                  ]}
                  onPress={() =>
                    setInterests((current) =>
                      current.includes(c)
                        ? current.filter((x) => x !== c)
                        : current.length < 10
                          ? [...current, c]
                          : current,
                    )
                  }
                >
                  <Text
                    style={{
                      color: interests.includes(c)
                        ? colors.accent
                        : colors.text,
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.button, interests.length < 3 && { opacity: 0.4 }]}
              disabled={interests.length < 3}
              onPress={() =>
                void request<{ user: User }>(
                  "/users/me/onboarding",
                  { interests },
                  "PUT",
                )
                  .then((r) => setUser(r.user))
                  .catch((e) => Alert.alert("Error", e.message))
              }
            >
              <Text style={styles.buttonText}>Build my feed</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Auth.Provider>
  );
}
export function useAuth() {
  const value = useContext(Auth);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  form: { padding: 24, gap: 15 },
  title: {
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -1,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    padding: 13,
    borderRadius: 6,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { fontWeight: "600", color: "white", fontSize: 14 },
  link: { color: colors.accent, fontSize: 14, paddingVertical: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 13,
  },
  selected: { borderColor: colors.accent, backgroundColor: "#eef1fc" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  section: { padding: 22, borderBottomWidth: 1, borderColor: colors.border },
  h2: {
    fontSize: 21,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: colors.text,
  },
  body: { fontSize: 14, lineHeight: 23, color: colors.text },
  muted: { fontSize: 12, color: colors.muted, lineHeight: 20 },
  avatar: {
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: colors.olive,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { fontWeight: "600", color: "#526044" },
  separator: { height: 1, backgroundColor: colors.border },
  error: { padding: 24, color: "#b7463b", textAlign: "center" },
  center: { padding: 45, alignItems: "center", gap: 15 },
});
