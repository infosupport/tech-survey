import type { PrismaDbClient } from "~/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "@auth/core/adapters";
import { AnswerOptionPrismaClient } from "~/server/db/prisma-client/answer-option";
import { BusinessUnitPrismaClient } from "~/server/db/prisma-client/business-unit";
import { QuestionResultPrismaClient } from "~/server/db/prisma-client/question-result";
import { RolePrismaClient } from "~/server/db/prisma-client/role";
import { SurveyPrismaClient } from "~/server/db/prisma-client/survey";
import { UsageMetricPrismaClient } from "~/server/db/prisma-client/usage-metric";
import { UserPrismaClient } from "~/server/db/prisma-client/user";

export class PrismaClient {
    #db: PrismaDbClient;
    users: UserPrismaClient;
    surveys: SurveyPrismaClient;
    businessUnits: BusinessUnitPrismaClient;
    roles: RolePrismaClient;
    questionResults: QuestionResultPrismaClient;
    answerOptions: AnswerOptionPrismaClient;
    usageMetrics: UsageMetricPrismaClient;

    constructor(prismaClient: PrismaDbClient) {
        this.#db = prismaClient;
        this.users = new UserPrismaClient(this, this.#db);
        this.surveys = new SurveyPrismaClient(this, this.#db);
        this.businessUnits = new BusinessUnitPrismaClient(this, this.#db);
        this.roles = new RolePrismaClient(this, this.#db);
        this.questionResults = new QuestionResultPrismaClient(this, this.#db);
        this.answerOptions = new AnswerOptionPrismaClient(this, this.#db);
        this.usageMetrics = new UsageMetricPrismaClient(this, this.#db);
    }

    /// Converts the PrismaClient to an Adapter
    /// only compile-time private because it's not meant to be used
    /// outside of this class except in `auth.ts`.
    // @ts-expect-error - Used in src/auth.ts
    private toPrismaAdapter() {
        return PrismaAdapter(this.#db) as Adapter;
    }
}

export interface IPrismaAdapterService {
    toPrismaAdapter(): Adapter;
}
