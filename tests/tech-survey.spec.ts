import { test } from "@playwright/test";
import { LandingPage } from "./landing-page";
import { SurveyPage } from "./survey-page";
import { slugify } from "~/utils/slugify";

let selectedRoles: string[] = [];

const navigateAndCheckSurveyPage = async (
  landingPage: LandingPage,
  surveyPage: SurveyPage,
  roles?: string[],
) => {
  await landingPage.navigateToLandingPage();
  if (roles) {
    selectedRoles = roles;
  } else {
    selectedRoles = (await landingPage.selectRandomRoles()).filter(
      (role): role is string => typeof role === "string",
    );
  }
  await landingPage.navigateToSurveyPage();
  await surveyPage.getCurrentURL();
  const sortedSelectedRoles =
    await surveyPage.isProgressionBarUpdated(selectedRoles);

  return sortedSelectedRoles;
};

test("New user logs in and navigates to survey", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  await navigateAndCheckSurveyPage(landingPage, surveyPage, ["General"]);
});

test("New user selects multiple roles", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  await navigateAndCheckSurveyPage(landingPage, surveyPage);
});

test("User attempts to navigate to different /survey/ page in the nav bar with all questions been filled in", async ({
  page,
}) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );

  await surveyPage.fillInQuestions(
    `http://localhost:3000/survey/${slugify(selectedRoles[1] ?? "")}`,
  );
});

test("User attempts to navigate to different /survey/ page in the nav bar without all questions been filled in", async ({
  page,
}) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );
  await surveyPage.fillInQuestions(
    `http://localhost:3000/survey/${slugify(selectedRoles[1] ?? "")}`,
    true,
  );
});

test("User fills in complete survey correctly", async ({ page }) => {
  const landingPage = new LandingPage(page);
  const surveyPage = new SurveyPage(page);
  const selectedRoles = await navigateAndCheckSurveyPage(
    landingPage,
    surveyPage,
  );

  for (let i = 0; i < selectedRoles.length; i++) {
    const isLastRole = i === selectedRoles.length - 1;
    const nextUrl = isLastRole
      ? "http://localhost:3000/thank-you"
      : `http://localhost:3000/survey/${slugify(selectedRoles[i + 1] ?? "")}`;

    await surveyPage.fillInQuestions(nextUrl, false, isLastRole);
  }
});
