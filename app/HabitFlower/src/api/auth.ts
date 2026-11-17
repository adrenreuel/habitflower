/**
 * Sign in with Apple / Google and account lifecycle.
 * Linking attaches the provider to the current (anonymous) account, so no
 * data moves and nothing is lost.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';

import { wipeDb } from '@/data/db';
import { repo } from '@/data/repo';
import type { LinkedProvider } from '@/domain/types';
import { useStore } from '@/state/store';
import { api, ApiError, setToken, type ProviderToken } from './client';
import { backendEnabled, config } from './config';
import { ensureAccount, syncNow } from './sync';

WebBrowser.maybeCompleteAuthSession();

export type AuthOutcome = { ok: true } | { ok: false; reason: 'cancelled' | 'in_use' | 'unavailable' | 'error'; message?: string };

async function appleToken(): Promise<ProviderToken | null> {
  const nonce = Crypto.randomUUID();
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
  try {
    const cred = await AppleAuthentication.signInAsync({ requestedScopes: [], nonce: hashed });
    return cred.identityToken ? { provider: 'apple', idToken: cred.identityToken, nonce } : null;
  } catch (e) {
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}

const GOOGLE_DISCOVERY = { authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth', tokenEndpoint: 'https://oauth2.googleapis.com/token' };

async function googleToken(): Promise<ProviderToken | null> {
  if (!config.googleIosClientId) throw new Error('Google sign-in is not configured');
  const clientId = config.googleIosClientId;
  const redirectUri = AuthSession.makeRedirectUri({ native: `com.googleusercontent.apps.${clientId.split('.')[0]}:/oauthredirect` });
  const nonce = Crypto.randomUUID();
  const req = new AuthSession.AuthRequest({ clientId, redirectUri, scopes: ['openid'], responseType: AuthSession.ResponseType.Code, extraParams: { nonce } });
  const result = await req.promptAsync(GOOGLE_DISCOVERY);
  if (result.type !== 'success') return null;
  const tokens = await AuthSession.exchangeCodeAsync({ clientId, redirectUri, code: result.params.code, extraParams: { code_verifier: req.codeVerifier ?? '' } }, GOOGLE_DISCOVERY);
  return tokens.idToken ? { provider: 'google', idToken: tokens.idToken, nonce } : null;
}

async function tokenFor(provider: LinkedProvider) {
  return provider === 'apple' ? appleToken() : googleToken();
}

/** Back up: link Apple or Google to this account. */
export async function linkProvider(provider: LinkedProvider): Promise<AuthOutcome> {
  if (!backendEnabled() || !(await ensureAccount())) return { ok: false, reason: 'unavailable' };
  try {
    const t = await tokenFor(provider);
    if (!t) return { ok: false, reason: 'cancelled' };
    const { user } = await api.link(t);
    useStore.getState().updateUser({ linkedProviders: user.linkedProviders });
    await syncNow();
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.code === 'identity_in_use') return { ok: false, reason: 'in_use' };
    return { ok: false, reason: 'error', message: (e as Error).message };
  }
}

/** "I already have an account": replace this device's data with that account's. */
export async function signInExisting(provider: LinkedProvider): Promise<AuthOutcome> {
  if (!backendEnabled()) return { ok: false, reason: 'unavailable' };
  try {
    const t = await tokenFor(provider);
    if (!t) return { ok: false, reason: 'cancelled' };
    const res = await api.signIn(t);
    wipeDb();
    await setToken(res.token);
    const s = useStore.getState();
    repo.setKV('user', { ...s.user, id: res.user.id, username: res.user.username, linkedProviders: res.user.linkedProviders });
    repo.setKV('onboarded', true);
    s.init();
    await syncNow();
    return { ok: true };
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return { ok: false, reason: 'error', message: 'No account is linked to that sign-in yet.' };
    return { ok: false, reason: 'error', message: (e as Error).message };
  }
}

/** Deletes the account everywhere (server first when there is one), then starts fresh. */
export async function deleteAccount(): Promise<AuthOutcome> {
  if (backendEnabled()) {
    try {
      if (await ensureAccount()) await api.deleteAccount();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) return { ok: false, reason: 'error', message: (e as Error).message };
    }
  }
  await setToken(null);
  useStore.getState().resetAll();
  return { ok: true };
}

/** Sign out: forget this device's copy. Unlinked accounts cannot be recovered. */
export async function signOut(): Promise<void> {
  await setToken(null);
  useStore.getState().resetAll();
}
