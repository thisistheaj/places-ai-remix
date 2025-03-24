// Presence time constants (in milliseconds)
export const PRESENCE_TIMES = {
  FIVE_MINUTES: 5 * 60 * 1000,    // 5 minutes
  SIX_HOURS: 144 * 60 * 60 * 1000, // 6 hours
} as const;

export interface Player {
  uid: string;
  name: string;
  x: number;
  y: number;
  color: number;
  direction: 'right' | 'up' | 'left' | 'down';
  moving: boolean;
  room: string | null;
  lastSeenAt: number;
  lastLeftAt?: number;
  skin?: string; // Character skin number (01-20)
  isBot?: boolean; // Simple flag to identify bot players
  webhook?: string; // URL for bot message delivery
  token?: string; // Authentication token for webhook
}

export interface PlayerPosition {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface NearbyPlayer {
  uid: string;
  name: string;
  distance: number;
}

export type PlayerMap = Record<string, Player>;
export type NearbyPlayerMap = Record<string, NearbyPlayer>;

export type PresenceStatus = 'online' | 'away' | 'offline';

export function getPresenceStatus(player: Player): PresenceStatus {
  const now = Date.now();
  const fiveMinutesAgo = now - PRESENCE_TIMES.FIVE_MINUTES;
  const sixHoursAgo = now - PRESENCE_TIMES.SIX_HOURS;

  // Offline conditions
  if (
    (player.lastLeftAt && player.lastLeftAt >= player.lastSeenAt) || // Explicitly left
    player.lastSeenAt < sixHoursAgo // No activity for 6+ hours
  ) {
    return 'offline';
  }

  // Away condition
  if (player.lastSeenAt < fiveMinutesAgo) {
    return 'away';
  }

  // Online condition
  return 'online';
}

export function getPresenceColor(status: PresenceStatus): number {
  switch (status) {
    case 'online': return 0x00ff00; // Green
    case 'away': return 0xffa500;   // Orange
    case 'offline': return 0xff0000; // Red
  }
} 