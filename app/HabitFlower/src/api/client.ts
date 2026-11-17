/**
 * The only module that talks to the Habitflower API (server/).
 * Every request goes through `request()`, which adds the bearer token and
 * turns failures into ApiError.
 */
import * as SecureStore from 'expo-secure-store';

import type { AppNotification, AwayRange, CheckIn, Habit, LinkedProvider, PauseRange, Task } from '@/domain/types';
import { backendEnabled, config } from './config';

const TOKEN_KEY = 'hf.token';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function request<T>(method: 'GET' | 'POST' | 'DELETE', path: string, body?: unknown, auth = true): Promise<T> {
  if (!backendEnabled()) throw new ApiError(0, 'no_backend', 'No server configured');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = await getToken();
    if (!token) throw new ApiError(401, 'no_token', 'Not signed up yet');
    headers.Authorization = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, 'offline', 'Network unavailable');
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, json.code ?? 'error', json.message ?? `Request failed (${res.status})`);
  return json as T;
}

export type ServerUser = { id: string; username: string | null; linkedProviders: LinkedProvider[]; createdAt: string };
export type AuthResponse = { token: string; user: ServerUser };

export type SyncTables = {
  habits: Habit[];
  checkIns: CheckIn[];
  pauses: PauseRange[];
  aways: AwayRange[];
  tasks: Task[];
};

export type SyncRequest = { since: string | null; changes: SyncTables };
export type SyncResponse = { serverTime: string; changes: SyncTables };

export type ProviderToken = { provider: LinkedProvider; idToken: string; nonce?: string };

export const api = {
  /** Creates the anonymous account for this device's local user id. */
  signUpAnonymous: (userId: string) => request<AuthResponse>('POST', '/v1/auth/anonymous', { userId }, false),

  /** Links Apple or Google to the current account. 409 identity_in_use if it belongs to another account. */
  link: (t: ProviderToken) => request<{ user: ServerUser }>('POST', '/v1/auth/link', t),

  /** "I already have an account": signs in to the account linked to this identity. */
  signIn: (t: ProviderToken) => request<AuthResponse>('POST', '/v1/auth/signin', t, false),

  /** Push local changes and pull everything changed on the server since `since`. */
  sync: (body: SyncRequest) => request<SyncResponse>('POST', '/v1/sync', body),

  /** Deletes the account and all of its data on the server. */
  deleteAccount: () => request<void>('DELETE', '/v1/account'),

  sendFeedback: (message: string) => request<void>('POST', '/v1/feedback', { message }),

  // v1.1 slots in here: friends, feed, reactions, presigned photo uploads, push tokens.
};

export type { AppNotification };
