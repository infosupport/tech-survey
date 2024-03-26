import http from "k6/http";

/**
 * Array of possible answer options.
 * @type {string[]}
 */
const answerOptions = [
  "clu2mvriq007ky5dmjuelhsbj",
  "clu2mvris007ly5dmufv524uo",
  "clu2mvriu007my5dm9i11gvpx",
  "clu2mvriw007ny5dml4kztguo",
];

/**
 * Array of question IDs.
 * @type {string[]}
 */
const questionIds = [
  "clu2mvqfz000hy5dmey2nwyee",
  "clu2mvqgo000ly5dmbsjzn75c",
  "clu2mvqgz000ny5dmqziyomfg",
  "clu2mvqtq002ny5dmz7ncmnp9",
  "clu2mvqtw002oy5dm9odncalw",
  "clu2mvqu1002py5dmppihq4ow",
  "clu2mvqu8002qy5dmrs7ezr2c",
  "clu2mvque002ry5dmg291mb7i",
  "clu2mvquk002sy5dmzjjbvj1s",
  "clu2mvqve002wy5dmqkmwyyqd",
];

/**
 * Function to simulate user behavior by making a GET request to fetch page content and a POST request to set question results.
 */
export function simulateUserBehavior() {
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
  const userIdStartIndex = surveyGeneralResponse.body?.indexOf("UserId:") + 8; // Length of 'UserId:' is 7
  const userIdEndIndex = surveyGeneralResponse.body?.indexOf(
    "</div>",
    userIdStartIndex,
  );
  const userIdString = surveyGeneralResponse.body
    .substring(userIdStartIndex, userIdEndIndex)
    .trim();

  // Extract only the UserId part from the extracted string
  let userId = userIdString.split('"')[2];

  // remove the \ from the userId
  userId = userId?.replace(/\\/g, "");

  // Make a POST request to /api/trpc/survey.setQuestionResult with extracted userId
  const setQuestionResultUrl =
    "http://localhost:3000/api/trpc/survey.setQuestionResult?batch=1";
  const payload = {
    0: {
      json: {
        userId: userId,
        questionId: questionIds[Math.floor(Math.random() * questionIds.length)],
        answerId:
          answerOptions[Math.floor(Math.random() * answerOptions.length)],
      },
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
