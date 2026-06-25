import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY_TOKEN = 'medtrace_token';
const KEY_USER = 'medtrace_user';

// ── Web note ────────────────────────────────────────────────────────────────
// expo-secure-store uses the iOS Keychain / Android Keystore on device.
// Neither is available on web, so we fall back to localStorage here.
// localStorage is NOT a secure store — this path exists only for local
// browser-based development. Never treat web as the production target for
// sensitive health tokens.
// ────────────────────────────────────────────────────────────────────────────

function webSave(key: string, value: string): void {
  localStorage.setItem(key, value);
}

function webGet(key: string): string | null {
  return localStorage.getItem(key);
}

function webDelete(key: string): void {
  localStorage.removeItem(key);
}

// ── Token ────────────────────────────────────────────────────────────────────

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSave(KEY_TOKEN, token);
  } else {
    await SecureStore.setItemAsync(KEY_TOKEN, token);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webGet(KEY_TOKEN);
  }
  return SecureStore.getItemAsync(KEY_TOKEN);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webDelete(KEY_TOKEN);
  } else {
    await SecureStore.deleteItemAsync(KEY_TOKEN);
  }
}

// ── User (cached alongside token to avoid a network round-trip on startup) ───

export async function saveUser(userJson: string): Promise<void> {
  if (Platform.OS === 'web') {
    webSave(KEY_USER, userJson);
  } else {
    await SecureStore.setItemAsync(KEY_USER, userJson);
  }
}

export async function getUser(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return webGet(KEY_USER);
  }
  return SecureStore.getItemAsync(KEY_USER);
}

export async function deleteUser(): Promise<void> {
  if (Platform.OS === 'web') {
    webDelete(KEY_USER);
  } else {
    await SecureStore.deleteItemAsync(KEY_USER);
  }
}

// ── Clear everything (convenience for logout) ────────────────────────────────

export async function clearSession(): Promise<void> {
  await Promise.all([deleteToken(), deleteUser()]);
}

// ── Per-user tutorial seen flag ───────────────────────────────────────────────

function tutorialKey(userId: string): string {
  return `medtrace_tutorial_${userId}`;
}

export async function getTutorialSeen(userId: string): Promise<boolean> {
  const key = tutorialKey(userId);
  const val = Platform.OS === 'web'
    ? webGet(key)
    : await SecureStore.getItemAsync(key);
  return val === 'true';
}

export async function setTutorialSeen(userId: string): Promise<void> {
  const key = tutorialKey(userId);
  if (Platform.OS === 'web') {
    webSave(key, 'true');
  } else {
    await SecureStore.setItemAsync(key, 'true');
  }
}

export async function clearTutorialSeen(userId: string): Promise<void> {
  const key = tutorialKey(userId);
  if (Platform.OS === 'web') {
    webDelete(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}
