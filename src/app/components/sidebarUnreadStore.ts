type UnreadSnapshot = {
  unreadMessagesCount: number;
  isNewUnread: boolean;
};

type SidebarMessage = {
  id?: string;
  text?: string;
};

let unreadMessagesCount = 0;
let isNewUnread = false;
let currentRoute = "";
let titleBlinkTimer: number | null = null;
let titleBlinkState = true;
const baseTitle = "SendMe Studio";
const listeners = new Set<() => void>();
let cachedSnapshot: UnreadSnapshot = {
  unreadMessagesCount,
  isNewUnread,
};

function updateBrowserTitle() {
  if (typeof document === "undefined") {
    return;
  }

  if (titleBlinkTimer && typeof window !== "undefined") {
    window.clearInterval(titleBlinkTimer);
    titleBlinkTimer = null;
  }

  if (unreadMessagesCount <= 0) {
    document.title = baseTitle;
    return;
  }

  document.title = `(${unreadMessagesCount}) ${baseTitle}`;

  if (document.visibilityState === "hidden" && typeof window !== "undefined") {
    titleBlinkState = true;
    titleBlinkTimer = window.setInterval(() => {
      document.title = titleBlinkState
        ? `(${unreadMessagesCount}) Nuevo mensaje`
        : baseTitle;
      titleBlinkState = !titleBlinkState;
    }, 1400);
  }
}

function emitChange() {
  cachedSnapshot = {
    unreadMessagesCount,
    isNewUnread,
  };
  updateBrowserTitle();
  listeners.forEach((listener) => listener());
}

function setNewUnreadFlag(value: boolean) {
  isNewUnread = value;
  emitChange();
}

export function formatUnreadCount(count: number) {
  return count > 9 ? "9+" : String(count);
}

export function subscribeUnreadMessages(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function unreadMessagesSnapshot(): UnreadSnapshot {
  return cachedSnapshot;
}

export function setUnreadMessagesCount(count: number, options: { highlight?: boolean } = {}) {
  const nextCount = Math.max(0, count);
  const didIncrease = nextCount > unreadMessagesCount;

  unreadMessagesCount = nextCount;
  isNewUnread = Boolean(options.highlight ?? didIncrease);
  emitChange();

  if (isNewUnread && typeof window !== "undefined") {
    window.setTimeout(() => setNewUnreadFlag(false), 1400);
  }
}

export function markMessagesSeen() {
  setUnreadMessagesCount(0, { highlight: false });
}

export function setCurrentRoute(route: string) {
  currentRoute = route;
}

export async function refreshUnreadMessages() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const response = await fetch("/api/whatsapp/messages?markSeen=false", {
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { unreadCount?: number };
    setUnreadMessagesCount(data.unreadCount ?? 0);
  } catch (error) {
    console.warn("Unread badge refresh failed", {
      error: error instanceof Error ? error.message : "Unknown unread refresh error",
    });
  }
}

export function handleIncomingMessage(message: SidebarMessage) {
  void message;

  if (currentRoute !== "/inbox") {
    setUnreadMessagesCount(unreadMessagesCount + 1, { highlight: true });
  }
}

export function bindUnreadTitleVisibility() {
  if (typeof document === "undefined") {
    return () => {};
  }

  const handleVisibilityChange = () => {
    titleBlinkState = true;
    updateBrowserTitle();
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  updateBrowserTitle();

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);

    if (titleBlinkTimer && typeof window !== "undefined") {
      window.clearInterval(titleBlinkTimer);
      titleBlinkTimer = null;
    }
  };
}
