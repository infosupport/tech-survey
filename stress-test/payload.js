/* eslint-disable import/no-anonymous-default-export */
// ts-check

import http from "k6/http";

/**
 * Array of possible answer options.
 * @type {string[]}
 */
const answerOptions = [
  "clu8gvcn2002niw792r89j29l",
  "clu8gvfgb007liw79mb9lgzvx",
  "clu8gvfgk007miw799dv29tsi",
  "clu8gvfgo007niw79wefxw4j9",
];

/**
 * Array of question IDs.
 * @type {string[]}
 */
const questionIds = [
  "clu8gvcn2002niw792r89j29l",
  "clu8gvcnd002oiw79e1b3aee2",
  "clu8gvcnn002piw79czd19e3q",
  "clu8gvco4002qiw79jsvxpwwe",
  "clu8gvcoo002siw79cgwq4z54",
  "clu8gvcof002riw79eaasuvr9",
  "clu8gvcpx002wiw79zwe692bg",
  "clu8gvct10035iw79tzi5sdiz",
  "clu8gvcy9003kiw79yqx50bmn",
  "clu8gvd0n003qiw79hg9r2iz2",
];

/**
 * Function to simulate user behavior by making a GET request to fetch page content and a POST request to set question results.
 */
export default function () {
  const surveyGeneralUrl = "http://localhost:3000/survey/general";

  const surveyGeneralResponse = http.get(surveyGeneralUrl);

  if (surveyGeneralResponse.status !== 200) {
    console.error(
      `GET /survey/general failed. Response status code: ${surveyGeneralResponse.status}`,
    );
    return;
  }

  if (!surveyGeneralResponse.body) {
    console.error("GET /survey/general failed. Response body is empty");
    return;
  }

  if (
    typeof surveyGeneralResponse.body !== "string" ||
    !surveyGeneralResponse.body.includes("UserId:")
  ) {
    console.error(
      "GET /survey/general failed. Page content does not contain 'UserId:'",
    );
    return;
  }

  // Extract the UserId from the HTML content
  const userIdStartIndex = surveyGeneralResponse.body.indexOf("UserId:") + 8; // Length of 'UserId:' is 7
  const userIdEndIndex = surveyGeneralResponse.body.indexOf(
    "</div>",
    userIdStartIndex,
  );
  const userIdString = surveyGeneralResponse.body
    .substring(userIdStartIndex, userIdEndIndex)
    .trim();

  // Extract only the UserId part from the extracted string
  let userId = userIdString.split('"')[2];

  // remove the \ from the userId
  if (userId !== undefined) {
    userId = userId.replace(/\\/g, "");
  }

  // Make a POST request to /api/trpc/survey.setQuestionResult with extracted userId
  const setQuestionResultUrl =
    "http://localhost:3000/api/trpc/survey.setQuestionResult?batch=1";
  const payload = {
    0: {
      json: [
        {
          userId: userId,
          questionId:
            questionIds[Math.floor(Math.random() * questionIds.length)],
          answerId:
            answerOptions[Math.floor(Math.random() * answerOptions.length)],
        },
      ],
    },
  };

  const headers = {
    "Content-Type": "application/json",
  };
  const setQuestionResultResponse = http.post(
    setQuestionResultUrl,
    JSON.stringify(payload),
    { headers: headers },
  );

  // Log the responses for debugging purposes
  console.log("Extracted UserId:", userId);
  console.log(
    "POST /api/trpc/survey.setQuestionResult response body:",
    setQuestionResultResponse.body,
  );
}
