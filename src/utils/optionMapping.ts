export const idToTextMap: Record<number, string> = {
  0: "🤗 Expert",
  1: "😏 Competent",
  2: "🤷‍♂️ Novice / Don’t know",
  3: "👷‍♀️ Novice / Would like to learn",
} as const;

export const idToAnswerMap: Record<string, string> = {
  cltfmxq3200002hsdmlswqpzx: "🤗 Expert",
  cltfmxq3300012hsdp6y7fs7e: "😏 Competent",
  cltfmxq3300022hsdl237nczb: "🤷‍♂️ Novice / Don’t know",
  cltfmxq3300032hsd3hvun83v: "👷‍♀️ Novice / Would like to learn",
} as const;

// Flatten the answers array from all questions
export const answerIdOrder: Record<string, number> = {
  cltfmxq3200002hsdmlswqpzx: 0,
  cltfmxq3300012hsdp6y7fs7e: 1,
  cltfmxq3300022hsdl237nczb: 2,
  cltfmxq3300032hsd3hvun83v: 3,
} as const;
