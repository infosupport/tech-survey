// @ts-check
import { type Page } from "playwright";
import { expect } from "@playwright/test";

export class FindTheExpertPage {
    public readonly page: Page;
    public readonly port;

    constructor(page: Page, port: number) {
        this.page = page;
        this.port = port;
    }

    async navigateToLandingPage() {
        await this.page.goto(`http://localhost:${this.port}/find-the-expert`);
        await expect(this.page.getByText("Find by tech")).toBeVisible();
    }
}
