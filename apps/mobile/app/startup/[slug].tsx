import { useLocalSearchParams } from "expo-router";
import { StartupScreen } from "../../src/screens";
export default function Screen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <StartupScreen slug={slug} />;
}
