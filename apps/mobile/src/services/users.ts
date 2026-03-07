import client from "../api/client";

export type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  locale: string;
  theme: string;
  createdAt: string;
};

export async function getMe() {
  const { data } = await client.get<UserProfile>("/users/me");
  return data;
}

export async function updateMe(updates: { name?: string; locale?: string; theme?: string }) {
  const { data } = await client.patch<UserProfile>("/users/me", updates);
  return data;
}
