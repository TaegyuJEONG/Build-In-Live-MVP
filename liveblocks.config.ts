import { createClient, LiveList, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY as string,
});

export type Marker = {
  id: string;
  x: number;
  y: number;
  selector?: string;
  search?: string;
  screenshotUrl?: string;
  xPercent?: number;
  yPercent?: number;
  projectId: string;
  author: string;
  authorId: string;
  authorColor: string;
  scrollY: number;
  pathname: string;
};

export type Comment = {
  id: string;
  text: string;
  author: string;
  authorId: string;
  timestamp: string;
};

type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
  pathname: string;
};

type Storage = {
  markers: LiveList<Marker>;
  comments: LiveMap<string, LiveList<Comment>>;
};

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useSelf,
} = createRoomContext<Presence, Storage>(client);
