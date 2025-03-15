export interface Player {
  uid: string;
  name: string;
  x: number;
  y: number;
  color: number;
  direction: 'up' | 'down' | 'left' | 'right';
  moving: boolean;
  room: string | null;
  lastSeenAt: number;
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