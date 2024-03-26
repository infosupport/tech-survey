export const idToTextMap: Record<number, string> = {
  0: "🤗 Expert",
  1: "😏 Competent",
  2: "👷‍♀️ Novice & Would like to learn",
  3: "🤷‍♂️ Novice / Don’t know",
} as const;

export const idToMoreInfo: Record<number, string> = {
  0: "🤗 You are capable of mentoring or training colleagues",
  1: "😏 You can apply this technology/practice in your daily work.",
  2: "👷‍♀️ You have limited experience but are interested to learn this technology/practice.",
  3: "🤷‍♂️ You have limited experience or don't know and are not interested in learning this.",
} as const;
