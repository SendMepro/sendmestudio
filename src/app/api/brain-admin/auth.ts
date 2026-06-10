import { cookies } from "next/headers";

const COOKIE_NAME = "sendme_brain_admin";
const COOKIE_SUPER_NAME = "sendme_brain_super_admin";
const LOCAL_DEV_FALLBACK_KEY = "SendMeBrain2026!";

function adminPassword() {
  return process.env.BRAIN_ADMIN_KEY || (isUsingLocalDevBrainAdminKey() ? LOCAL_DEV_FALLBACK_KEY : "");
}

export function isUsingLocalDevBrainAdminKey() {
  return process.env.NODE_ENV === "development" && !process.env.BRAIN_ADMIN_KEY;
}

export function localDevBrainAdminKeyHint() {
  return isUsingLocalDevBrainAdminKey() ? LOCAL_DEV_FALLBACK_KEY : null;
}

export async function isBrainAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === "authenticated";
}

export async function isSuperAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_SUPER_NAME)?.value === "true";
}

export function isValidBrainAdminPassword(password: string) {
  const expectedPassword = adminPassword();
  return expectedPassword.length > 0 && password === expectedPassword;
}

export async function setBrainAdminSession(isSuper: boolean = false) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  if (isSuper) {
    cookieStore.set(COOKIE_SUPER_NAME, "true", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
  } else {
    cookieStore.delete(COOKIE_SUPER_NAME);
  }
}

export async function clearBrainAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(COOKIE_SUPER_NAME);
}
