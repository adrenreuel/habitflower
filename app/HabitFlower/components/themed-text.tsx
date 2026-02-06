import { Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & { type?: string };

export function ThemedText(props: ThemedTextProps) {
  return <Text {...props} />;
}
