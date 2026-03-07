import client from "../api/client";
import * as SecureStore from "expo-secure-store";

type AuthResponse = {
  user: { id: string; email: string; displayName: string };
  accessToken: string;
  refreshToken: string;
};

export async function signup(email: string, password: string, displayName: string) {
  const { data } = await client.post<AuthResponse>("/auth/signup", {
    email,
    password,
    displayName,
  });
  await storeTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await client.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  await storeTokens(data.accessToken, data.refreshToken);
  return data;
}

export async function logout() {
  try {
    const refreshToken = await SecureStore.getItemAsync("refreshToken");
    await client.post("/auth/logout", { refreshToken });
  } finally {
    await clearTokens();
  }
}

export async function forgotPassword(email: string) {
  await client.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string) {
  await client.post("/auth/reset-password", { token, password });
}

async function storeTokens(accessToken: string, refreshToken: string) {
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("refreshToken", refreshToken);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}
