import type { Vec } from "../core/math";

export interface Mote {
  pos: Vec;
  vel: Vec;
  trail: { x: number; y: number; a: number }[];
}

export interface Anchor {
  id: number;
  pos: Vec;
  home: Vec;
  radius: number;
  phase: number;
  orbit: number;
  spin: number;
  drift: Vec;
}

export interface Shard {
  pos: Vec;
  pulse: number;
  taken: boolean;
}

export interface Fracture {
  points: Vec[];
  grow: number;
  max: number;
  age: number;
  life: number;
}

export interface Debris {
  pos: Vec;
  vel: Vec;
  rot: number;
  spin: number;
  size: number;
  sides: number;
}

export interface Well {
  pos: Vec;
  strength: number;
  radius: number;
  pulse: number;
}

export interface World {
  mote: Mote;
  anchors: Anchor[];
  shards: Shard[];
  fractures: Fracture[];
  debris: Debris[];
  wells: Well[];
}
