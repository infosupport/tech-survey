// @ts-check
import { type Page } from "playwright";
import { expect } from "@playwright/test";

export class SurveyPage {
    public readonly page: Page;
    public readonly port;

    constructor(page: Page, port: number) {
        this.page = page;
        this.port = port;
    }

    async navigateToLandingPage() {
        await this.page.goto(`http://localhost:${this.port}`);
        await expect(
            this.page.getByRole("heading", {
                name: "Select Roles",
            }),
        ).toBeVisible();
    }

    async checkUrl(path: string) {
        expect(this.page.url()).toBe(`http://localhost:${this.port}/${path}`);
    }

    async navigateToAnonymousResults(role: string) {
        await this.page.goto(
            `http://localhost:${this.port}/result?role=${role}`,
        );
        await this.page.waitForURL(
            `http://localhost:${this.port}/result?role=${role}`,
        );

        await expect(
            this.page.getByText(`Viewing results for role:`),
        ).toBeVisible();
    }

    async navigateToFindTheExpert(role: string) {
        await this.page.goto(
            `http://localhost:${this.port}/find-the-expert/tech-page?role=${role}`,
        );
        await this.page.waitForURL(
            `http://localhost:${this.port}/find-the-expert/tech-page?role=${role}`,
        );

        await expect(
            this.page.getByText(`Viewing results for role`),
        ).toBeVisible();
    }

    async checkAnonymousResultsIsNotEmpty() {
        // we should not see '404 Not Found' on the page
        await expect(this.page.getByText("404")).toBeHidden();
    }

    async checkUserIsPresentInFindTheExpertPage(name: string) {
        await expect(
            this.page.getByRole("cell", { name: name }).first(),
        ).toBeVisible();
    }

    async checkDoNotContactIsPresentInFindTheExpertPage() {
        const doNotContact = "Do not contact";

        await expect(
            this.page.getByRole("cell", { name: doNotContact }).first(),
        ).toBeVisible();
    }

    async checkDoNotContactIsHiddenInFindTheExpertPage() {
        const doNotContact = "Do not contact";

        await expect(
            this.page.getByRole("cell", { name: doNotContact }).first(),
        ).toBeHidden();
    }

    async goToNextQuestionsForDifferentRole() {
        await this.page
            .getByRole("button", { name: "Next", exact: true })
            .click();
    }

    async submitAnswers() {
        await this.page
            .getByRole("button", { name: "Submit", exact: true })
            .click();
    }

    async selectRoles(roleNames: readonly string[]) {
        await this.page.waitForLoadState("networkidle");
        for (const roleName of roleNames) {
            const roleCheckbox = this.page
                .locator(`li:has-text("${roleName}")`)
                .first()
                .locator('input[type="checkbox"]');
            await roleCheckbox.check();
        }
    }

    async selectCommunicationPreferences(preferences: readonly string[]) {
        for (const preference of preferences) {
            const preferenceCheckbox = this.page
                .locator(`li:has-text("${preference}")`)
                .first()
                .locator('input[type="checkbox"]');
            await preferenceCheckbox.check();
        }
    }

    async navigateToSurveyPage() {
        await this.page
            .getByRole("button", { name: "Go to survey", exact: true })
            .click();
        await this.page.waitForURL(
            `http://localhost:${this.port}/survey/general`,
        );
    }

    async checkProgressionBarForRoles(roles: readonly string[]) {
        const roleElements = [];
        for (const role of roles) {
            const roleElement = this.page.getByText(role, { exact: true });
            roleElements.push(roleElement);
        }
        return roleElements;
    }

    async mobileCheckProgressionBarForRoles(roles: readonly string[]) {
        const roleElements = [];
        await this.page
            .getByRole("button", {
                name: `${roles[0]} - 0/${roles.length} 0.00% Completed`,
            })
            .click();
        for (const role of roles) {
            const roleElement = this.page.getByText(role, { exact: true });
            roleElements.push(roleElement);
        }

        return roleElements;
    }

    async checkRoleForQuestion(questionText: string[]) {
        const questionElements = [];
        for (const text of questionText) {
            const questionElement = this.page.getByText(text);
            questionElements.push(questionElement);
        }
        return questionElements;
    }

    async selectAnswerOption(questionText: string, optionIndex: number) {
        const optionLocator = this.page
            .getByRole("row", { name: questionText })
            .getByLabel("")
            .nth(optionIndex);
        await optionLocator.click();
    }

    async mobileSelectAnswerOption(questionText: string) {
        const question = this.page.getByRole("heading", { name: questionText });
        const questionContainer = question.locator("xpath=../..");
        const radioGroups = questionContainer.locator('[role="radiogroup"]');
        const selectedRadioGroup = radioGroups.nth(0);
        const radioButtons = selectedRadioGroup.locator('button[role="radio"]');
        await radioButtons.click();
    }

    async checkForValidationError(role: string) {
        await this.checkUrl(`survey/${role}`);
        return this.page.getByText("You need to select an answer");
    }
}
