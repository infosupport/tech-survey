import type { UserIdAndAnswerId } from "~/models/types";
import { db } from "~/server/db";

export const fetchUserAnswersForRole = async (role:string) => {
  return await db.questionResult.findMany({
    where: {
      question: {
        roles: {
          some: {
            role: {
              equals: role,
              mode: "insensitive"
            }
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      }
    },
  });
};

export const fetchUserAnswers = async () => {
  return await db.questionResult.findMany({
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
};

export const fetchUserAnswersForRoleAndQuestion = async (role:string, question: string) => {
  return await db.questionResult.findMany({
    where:
    {
      question: {
        questionText : {
          contains: question,
          mode: "insensitive"
        },
        roles : {
          some: {
            role: {
              equals: role,
              mode: "insensitive"
            }
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
}

export const fetchUserAnswersForQuestion = async (question: string) => {
  return await db.questionResult.findMany({
    where:
    {
      question: {
        questionText : {
          contains: question,
          mode: "insensitive"
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
}

export const fetchUsersAndAnswerOptions = async (
  userIds: string[],
  answerIds: string[],
) => {
  return await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        communicationPreferences: true,
        roles: true,
      },
    }),
    db.answerOption.findMany({
      where: { id: { in: answerIds } },
      select: { id: true, option: true },
    }),
  ]);
};

export const fetchUserAnswersForUnit = async(
  unit: string
) => {
  return await db.questionResult.findMany({
    where: {
      user: {
        businessUnit: {
          unit: {
            equals: unit,
            mode: "insensitive"
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      }
    },
  });
}

export const fetchUserAnswersForQuestionAndUnit = async(tech: string, unit: string) => {
  return await db.questionResult.findMany({
    where:
    {
      question: {
        questionText : {
          contains: tech,
          mode: "insensitive"
        }
      },
      user: {
        businessUnit: {
          unit: {
            equals: unit,
            mode: "insensitive"
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
}

export const fetchUserAnswersForRoleAndUnit = async(role:string, unit:string) => {
  return await db.questionResult.findMany({
    where: {
      question: {
        roles: {
          some: {
            role: {
              equals: role,
              mode: "insensitive"
            }
          }
        }
      },
      user: {
        businessUnit: {
          unit: {
            equals: unit,
            mode: "insensitive"
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      }
    },
  });
}

export const fetchUserAnswersForQuestionAndRoleAndUnit = async(tech:string, role:string, unit:string) => {
  return await db.questionResult.findMany({
    where:
    {
      question: {
        questionText : {
          contains: tech,
          mode: "insensitive"
        },
        roles : {
          some: {
            role: {
              equals: role,
              mode: "insensitive"
            }
          }
        }
      },
      user: {
        businessUnit: {
          unit: {
            equals: unit,
            mode: "insensitive"
          }
        }
      }
    },
    include: {
      question: {
        include: {
          roles: true,
        },
      },
    },
  });
}

function uniqueValues<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function extractUniqueIds(userAnswersForRole: UserIdAndAnswerId[]): {
  userIds: string[];
  answerIds: string[];
} {
  const userIds = uniqueValues(userAnswersForRole.map((entry) => entry.userId));
  const answerIds = uniqueValues(
    userAnswersForRole.map((entry) => entry.answerId),
  );
  return { userIds, answerIds };
}
