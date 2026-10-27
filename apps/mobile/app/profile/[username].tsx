import { useLocalSearchParams } from "expo-router";
import { ProfileScreen } from "../../src/screens";
export default function Screen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  return <ProfileScreen username={username} />;
}
