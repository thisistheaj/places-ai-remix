export type MessageType = 'global' | 'room' | 'dm' | 'system';

export interface Message {
  id?: string;
  uid: string;
  sender: string;
  text: string;
  timestamp: number;
  type: MessageType;
  room?: string;
  targetId?: string;
}

export interface GlobalMessage extends Message {
  type: 'global';
}

export interface RoomMessage extends Message {
  type: 'room';
  room: string;
}

export interface DirectMessage extends Message {
  type: 'dm';
  targetId: string;
}

export interface SystemMessage extends Message {
  type: 'system';
}

export type MessageMap = Record<string, Message>; 