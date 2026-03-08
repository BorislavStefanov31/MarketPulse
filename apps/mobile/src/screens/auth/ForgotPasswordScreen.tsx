import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { forgotPassword } from "../../services/auth";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/AuthStack";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <View style={styles.form}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            If an account exists for {email}, we sent a reset code.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("ResetPassword")}
          >
            <Text style={styles.buttonText}>Enter Reset Code</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  form: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", textAlign: "center", marginBottom: 32 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#2563eb", textAlign: "center", marginTop: 8, fontSize: 14 },
});
