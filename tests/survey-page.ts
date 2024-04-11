import { type Page, type Locator } from "playwright";
import { expect } from "@playwright/test";

export class SurveyPage {
  constructor(private page: Page) {}

  async getCurrentURL() {
    expect(this.page.url()).toBe("http://localhost:3000/survey/general");
  }

  async isProgressionBarUpdated(roles: string[]) {
    for (const role of roles) {
      await expect(this.page.getByText(role, { exact: true })).toBeVisible();
    }

    // return the roles sorted by the order they appear on the page
    // look for classes: absolute -rotate-45 whitespace-nowrap text-xs font-semibold
    const navItem = this.page.locator(
      ".absolute.-rotate-45.whitespace-nowrap.text-xs.font-semibold",
    );
    const roleTexts = [];
    const elementsCount = await navItem.count();
    for (let i = 0; i < elementsCount; i++) {
      const roleText = await navItem.nth(i).innerText();
      roleTexts.push(roleText);
    }

    return roleTexts;
  }

  async fillInQuestions(
    nextPageUrl: string,
    skipQuestions?: boolean,
    isLastRole?: boolean,
  ) {
    const rows = this.page.getByRole("row");
    const elementsCount = await rows.count();

    await this.fillRandomRadioButtons(rows, elementsCount, skipQuestions);
    await this.clickNextButton(isLastRole);

    if (skipQuestions) {
      await this.handleSkippedQuestions(rows, elementsCount);
    }

    await this.page.waitForURL(nextPageUrl);
  }

  private async fillRandomRadioButtons(
    rows: Locator,
    elementsCount: number,
    skipQuestions?: boolean,
  ) {
    for (let i = 1; i < elementsCount; i++) {
      const row = rows.nth(i);
      const radioButtons = row.locator("button");

      const isChecked = await this.isRadioButtonChecked(radioButtons);

      if (isChecked || (skipQuestions && i % 3 === 0)) {
        continue;
      }

      await this.clickRandomRadioButton(radioButtons);
    }
  }

  private async clickNextButton(isLastRole?: boolean) {
    const buttonText = isLastRole ? "Submit" : "Next";
    await this.page
      .getByRole("button", { name: buttonText, exact: true })
      .click();
  }

  private async handleSkippedQuestions(rows: Locator, elementsCount: number) {
    const errorMessage = await this.page.isVisible(
      "text=You need to select an answer",
    );
    expect(errorMessage).toBe(true);

    for (
      let skippedQuestionIndex = 3;
      skippedQuestionIndex < elementsCount;
      skippedQuestionIndex += 3
    ) {
      const skippedRow = rows.nth(skippedQuestionIndex);
      const skippedRadioButtons = skippedRow.locator("button");
      await this.clickRandomRadioButton(skippedRadioButtons);
    }
  }

  private async isRadioButtonChecked(radioButtons: Locator) {
    for (let j = 0; j < 4; j++) {
      const radioButton = radioButtons.nth(j);
      const checked = await radioButton.getAttribute("aria-checked");
      if (checked === "true") {
        return true;
      }
    }
    return false;
  }

  private async clickRandomRadioButton(radioButtons: Locator) {
    const randomIndex = Math.floor(Math.random() * 4);
    await radioButtons.nth(randomIndex).click();
  }
}
