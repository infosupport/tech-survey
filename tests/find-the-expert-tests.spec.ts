import { expect, test, type Page } from "@playwright/test";
import { type ChildProcess } from "child_process";

import { TestSetup } from "~/tests/helpers/test-setup";
import treeKill from "tree-kill";

import { promisify } from "node:util";
import { FindTheExpertPage } from "~/tests/find-the-expert-page";
import { DbHelper } from "~/tests/helpers/db";
import { USER_EMAIL, USER_NAME, UserDbHelper } from "~/tests/helpers/db/user";
import { SurveyDbHelper } from "~/tests/helpers/db/survey";

const treeKillAsPromised = promisify(treeKill);
const killAllProcesses = async (process: ChildProcess) => {
    if (process?.pid) {
        await treeKillAsPromised(process.pid);
    }
};

let nextProcess: ChildProcess;
let findTheExpertPage: FindTheExpertPage;
let dbHelper: DbHelper;
let userDbHelper: UserDbHelper;
let surveyDbHelper: SurveyDbHelper;
let page: Page;

test.beforeAll(async ({ browser }) => {
    const setup = await TestSetup.setup(browser, true);
    page = setup.page;
    dbHelper = setup.dbHelper;
    nextProcess = setup.nextProcess;

    userDbHelper = new UserDbHelper(dbHelper.getClient());
    surveyDbHelper = new SurveyDbHelper(dbHelper.getClient());
    findTheExpertPage = new FindTheExpertPage(page, setup.port);
});

test.afterAll(async () => {
    await dbHelper.getContainer().stop();
    await page.close();
    await killAllProcesses(nextProcess);
});

test.describe("Desktop tests", () => {
    test.beforeEach(async () => {
        await userDbHelper.createUser(USER_NAME, USER_EMAIL);
        await surveyDbHelper.createMultipleRoleSurvey();
        await findTheExpertPage.navigateToLandingPage();
    });

    test.afterEach(async () => {
        await dbHelper.cleanDatabase();
    });

    test("Navigate to tech-page without results", async () => {
        await page.getByRole("button", { name: "Find by tech" }).click();
        await page.waitForURL("**/find-the-expert/tech-page");
        await expect(
            page.getByText(
                "There are no non-anonymous results yet. Please check back later.",
            ),
        ).toBeVisible();
    });
});
