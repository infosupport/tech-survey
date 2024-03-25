import http from "k6/http";

const answerOptions = [
  "clu2mvriq007ky5dmjuelhsbj",
  "clu2mvris007ly5dmufv524uo",
  "clu2mvriu007my5dm9i11gvpx",
  "clu2mvriw007ny5dml4kztguo",
];

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

export default function () {
  // Make a GET request to /survey/general to fetch the page content
  const surveyGeneralUrl = "http://localhost:3000/survey/general";
  const surveyGeneralResponse = http.get(surveyGeneralUrl);

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
  userId = userId.replace(/\\/g, "");

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
