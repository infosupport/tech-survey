export const idToTextMap: Record<number, string> = {
  0: "🤗 Expert",
  1: "😏 Competent",
  2: "👷‍♀️ Novice & Would like to learn",
  3: "🤷‍♂️ Novice / Don’t know",
} as const;

export const idToAnswerMap: Record<string, string> = {
  cltfmxq3200002hsdmlswqpzx: "🤗 Expert",
  cltfmxq3300012hsdp6y7fs7e: "😏 Competent",
  cltfmxq3300022hsdl237nczb: "👷‍♀️ Novice & Would like to learn",
  cltfmxq3300032hsd3hvun83v: "🤷‍♂️ Novice / Don’t know",
} as const;

export const idToMoreInfo: Record<number, string> = {
  0: "🤗 You are capable of mentoring or training colleagues",
  1: "😏 You can apply this technology/practice in your daily work.",
  2: "👷‍♀️ You have limited experience but are interested to learn this technology/practice.",
  3: "🤷‍♂️ You have limited experience or don't know and are not interested in learning this.",
} as const;

// Flatten the answers array from all questions
export const answerIdOrder: Record<string, number> = {
  cltfmxq3200002hsdmlswqpzx: 0,
  cltfmxq3300012hsdp6y7fs7e: 1,
  cltfmxq3300022hsdl237nczb: 2,
  cltfmxq3300032hsd3hvun83v: 3,
} as const;
