export type MessageType = 'global' | 'room' | 'dm' | 'system';

export interface BaseMessage {
  id: string;
  uid: string;
  senderId: string;
  sender: string;
  text: string;
  timestamp: number;
  type: 'global' | 'dm' | 'room' | 'system';
}

export interface GlobalMessage extends BaseMessage {
  type: 'global';
}

export interface RoomMessage extends BaseMessage {
  type: 'room';
  room: string;
}

export interface DirectMessage extends BaseMessage {
  type: 'dm';
  targetId: string;
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
}

export type Message = GlobalMessage | DirectMessage | RoomMessage | SystemMessage;

export type MessageMap = Record<string, Message>; 