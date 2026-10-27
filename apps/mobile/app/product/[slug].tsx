import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { request } from "../../src/client";
import { styles } from "../../src/context";
import type { Product } from "../../src/types";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product>(),
    [error, setError] = useState(""),
    [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError("");
    void request<{ product: Product }>(`/products/${encodeURIComponent(slug)}`)
      .then((result) => {
        if (!cancelled) setProduct(result.product);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, retry]);
  if (!product)
    return (
      <View style={styles.center}>
        {error ? (
          <Pressable onPress={() => setRetry((n) => n + 1)}>
            <Text>{error} · Retry</Text>
          </Pressable>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ padding: 22, gap: 18 }}
    >
      {product.imageUrl && (
        <Image
          source={{ uri: product.imageUrl }}
          style={{ width: "100%", aspectRatio: 4 / 3, borderRadius: 12 }}
        />
      )}
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.muted}>
        {product.category} · {product.status}
      </Text>
      <Text style={styles.body}>{product.description}</Text>
      <Pressable
        onPress={() => router.push(`/startup/${product.startup.slug}`)}
      >
        <Text style={styles.link}>Built by {product.startup.name} ↗</Text>
      </Pressable>
      {product.website && (
        <Pressable
          style={styles.button}
          onPress={() => {
            if (/^https?:\/\//.test(product.website!))
              void Linking.openURL(product.website!);
          }}
        >
          <Text style={styles.buttonText}>Visit product website ↗</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
