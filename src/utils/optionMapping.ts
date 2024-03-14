export const idToTextMap: Record<number, string> = {
  0: "👍 Used it > Would use again",
  1: "👎 Used it > Would not use again",
  2: "✅ Heard of it > Would like to learn",
  3: "🚫 Heard of it > Not interested",
  4: "❓ Never heard of it/Not sure what it is",
} as const;

export const idToTextMapMobile: Record<number, string> = {
  0: "👍 Used it",
  1: "👎 Used it",
  2: "✅ Heard of it",
  3: "🚫 Heard of it",
  4: "❓ Never heard of it",
} as const;
