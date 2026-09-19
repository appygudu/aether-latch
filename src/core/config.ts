export const FREE_PLAYS = 3;
export const RUN_DURATION = 80;
export const LATCH_RANGE = 318;
export const FILAMENT_FLIGHT = 0.09;
export const SPRING_K = 46;
export const SPRING_DAMP = 5.2;
export const REST_FACTOR = 0.76;
export const MAX_STRETCH = 1.82;
export const MAX_SPEED = 1040;
export const AIR_DRAG = 0.22;
export const GRAVITY_Y = 36;
export const MOTE_RADIUS = 9;
export const ANCHOR_RADIUS = 16;
export const SHARD_RADIUS = 7;
export const DEBRIS_HIT = 13;
export const WELL_RADIUS = 118;
export const CAMERA_FOLLOW = 7.2;
export const LOOK_AHEAD = 0.11;
export const SHAKE_DECAY = 9;

export const STORAGE = {
  playsUsed: "aether_plays_used",
  subscribed: "aether_subscribed",
  plan: "aether_plan",
  highScore: "aether_high_score",
  bestCombo: "aether_best_combo",
  promptSeen: "aether_prompt_seen",
  muted: "aether_muted",
} as const;

export const COLORS = {
  cyan: "#7cf4ff",
  violet: "#8b6cff",
  hot: "#ff7ad9",
  aurora: ["#7cf4ff", "#9d7cff", "#ff7ad9", "#ffe08a"],
} as const;
