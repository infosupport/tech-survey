import { db } from "./db"

export const logUsageMetric = async (action: string) => {
    await db.usageMetrics.create({
        data: {
            action: action
        }
    });
}