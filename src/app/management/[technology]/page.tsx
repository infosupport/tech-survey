import type { ColumnDef } from "@tanstack/react-table";
import { columns } from "~/components/columns";
import { DataTable } from "~/components/data-table";
import type { QuestionResult } from "~/models/types";
import { db } from "~/server/db";

const ManagementPage = async () => {
  const userAnswersForRole: QuestionResult[] = await db.questionResult.findMany(
    {
      include: {
        question: {
          include: {
            roles: true,
          },
        },
      },
    },
  );

  // Extract all unique user IDs and answer IDs
  const userIds = Array.from(
    new Set(userAnswersForRole.map((entry) => entry.userId)),
  );
  const answerIds = Array.from(
    new Set(userAnswersForRole.map((entry) => entry.answerId)),
  );

  // Fetch all users and answer options in a single query
  const [users, answerOptions] = await Promise.all([
    db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    }),
    db.answerOption.findMany({
      where: { id: { in: answerIds } },
      select: { id: true, option: true },
    }),
  ]);

  // Create a map of user IDs to user objects for easy lookup
  const userMap: Record<string, { name: string; email: string }> = {};
  for (const user of users) {
    userMap[user.id] = {
      name: user.name ?? "Unknown User",
      email: user.email ?? "Unknown Email",
    };
  }

  // Create a map of answer IDs to answer option objects for easy lookup
  const answerOptionMap: Record<string, string> = {};
  for (const answerOption of answerOptions) {
    answerOptionMap[answerOption.id] =
      answerOption.option.toString() ?? "Unknown Answer";
  }

  // Group the data by roles and questions
  const dataByRoleAndQuestion: Record<
    string,
    Record<string, { name: string; email: string; answer: string }[]>
  > = {};

  for (const entry of userAnswersForRole) {
    for (const role of entry.question.roles ?? []) {
      const roleName = role.role || "Unknown Role";
      const questionText = entry.question.questionText || "Unknown Question";

      if (!dataByRoleAndQuestion[roleName]) {
        dataByRoleAndQuestion[roleName] = {};
      }
      if (!dataByRoleAndQuestion[roleName][questionText]) {
        dataByRoleAndQuestion[roleName][questionText] = [];
      }

      dataByRoleAndQuestion[roleName][questionText]?.push({
        name: userMap[entry.userId]?.name ?? "Unknown User",
        email: userMap[entry.userId]?.email ?? "Unknown Email",
        answer: answerOptionMap[entry.answerId] ?? "Unknown Answer",
      });

      // Sort the answers based on the answer value (0, 1, 2, or 3)
      dataByRoleAndQuestion[roleName][questionText].sort((a, b) => {
        const answerValueA = parseInt(a.answer);
        const answerValueB = parseInt(b.answer);
        return answerValueA - answerValueB;
      });
    }
  }

  return (
    <div>
      {Object.keys(dataByRoleAndQuestion).map((role) => (
        <div key={role}>
          <h2 className="mb-4 text-2xl font-bold">{role}</h2>
          {dataByRoleAndQuestion[role] &&
            Object.keys(dataByRoleAndQuestion[role]).map((question) => (
              <div key={question}>
                <h3 className="mb-3 text-lg font-semibold">{question}</h3>
                <div style={{ marginBottom: "1.5rem" }}>
                  {" "}
                  <DataTable
                    columns={
                      columns as ColumnDef<
                        { name: string; email: string; answer: string },
                        unknown
                      >[]
                    }
                    data={dataByRoleAndQuestion[role]?.[question] ?? []}
                  />
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

export default ManagementPage;
