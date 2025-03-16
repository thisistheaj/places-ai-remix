export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
}

export interface RoomBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type RoomMap = Record<string, Room>; 