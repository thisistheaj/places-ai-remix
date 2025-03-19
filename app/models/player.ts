// Presence time constants (in milliseconds)
export const PRESENCE_TIMES = {
  FIVE_MINUTES: 5 * 1 * 1000,    // 5 minutes
  TWENTY_MINUTES: 20 * 60 * 1000, // 20 minutes
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
  const twentyMinutesAgo = now - PRESENCE_TIMES.TWENTY_MINUTES;

  // Offline conditions
  if (
    (player.lastLeftAt && player.lastLeftAt >= player.lastSeenAt) || // Explicitly left
    player.lastSeenAt < twentyMinutesAgo // No activity for 20+ minutes
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