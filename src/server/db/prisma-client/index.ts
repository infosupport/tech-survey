import type { PrismaDbClient } from "~/prisma";
import { UserPrismaClient } from "./user";
import { SurveyPrismaClient } from "./survey";
import { BusinessUnitPrismaClient } from "./businessUnit";
import { RolePrismaClient } from "./role";
import { QuestionResultPrismaClient } from "./questionResult";
import { AnswerOptionPrismaClient } from "./answerOption";
import { UsageMetricPrismaClient } from "./usageMetric";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "@auth/core/adapters";

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
    // @ts-expect-error
    private toPrismaAdapter() {
        return PrismaAdapter(this.#db) as Adapter;
    }
}

export interface IPrismaAdapterService {
    toPrismaAdapter(): Adapter;
}
