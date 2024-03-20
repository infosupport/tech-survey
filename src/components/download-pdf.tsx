/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { answerIdOrder, idToAnswerMap } from "~/utils/optionMapping";
import { type PdfTransformedData } from "~/models/types";

import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "./svg";

const PDFDownloadLink = dynamic(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  },
);

const PDFDocument = ({
  userAnswersForRole,
}: {
  userAnswersForRole: PdfTransformedData[];
}) => {
  const rolesIncluded: Record<string, boolean> = {};

  // First, sort UserAnswersForRole based on alphabetical order of question text.
  userAnswersForRole.sort((a, b) => {
    const textA = a.question.questionText.toUpperCase();
    const textB = b.question.questionText.toUpperCase();
    return textA < textB ? -1 : textA > textB ? 1 : 0;
  });

  // Flatten the answers array from all questions
  const allAnswers = userAnswersForRole.reduce(
    (acc: { questionId: string; answerId: string }[], { answers }) => {
      return acc.concat(answers);
    },
    [],
  );

  // Sort all answers based on the custom order
  allAnswers.sort((a, b) => {
    const positionA = answerIdOrder[a.answerId] ?? 0;
    const positionB = answerIdOrder[b.answerId] ?? 0;
    return positionA - positionB;
  });

  // Create a map to store the position of each question ID in allAnswers
  const questionIdPositionMap: Record<string, number> = {};
  allAnswers.forEach((answer, index) => {
    questionIdPositionMap[answer.questionId] = index;
  });

  // Rearrange the order of UserAnswersForRole based on the position of the question IDs in allAnswers
  userAnswersForRole.sort((a, b) => {
    const positionA = questionIdPositionMap[a.question.id] ?? 0;
    const positionB = questionIdPositionMap[b.question.id] ?? 0;
    return positionA - positionB;
  });

  return (
    <Document>
      {/* Group userAnswersForRole by role */}
      {userAnswersForRole.map(({ question }) => {
        const roles = question.roles ?? [];
        return roles.map((role) => {
          const roleId = role.id;
          if (rolesIncluded[roleId]) {
            // If the role has already been included, return null to skip it
            return null;
          }
          // Mark the role as included
          rolesIncluded[roleId] = true;

          return (
            <Page key={roleId} style={styles.page}>
              <View style={styles.section}>
                {/* Role Name */}
                <Text style={styles.roleTitle}>Role: {role.role}</Text>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <Text style={styles.columnHeader}>Question</Text>
                  <Text style={styles.columnHeaderAnswer}>Answer</Text>
                </View>
                {/* Iterate over questions and answers */}
                {userAnswersForRole
                  .filter(({ question }) =>
                    question.roles?.find((r) => r.id === roleId),
                  )
                  .map(({ question, answers }) => (
                    <View key={question?.id}>
                      {/* Render the question */}
                      <View style={styles.tableRow}>
                        <Text style={styles.cell}>
                          {question?.questionText || "Question not found"}
                        </Text>
                        {/* Render the answer */}
                        <Text style={styles.answerCell}>
                          {answers
                            .map(({ answerId }) => idToAnswerMap[answerId])
                            .join(", ")}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            </Page>
          );
        });
      })}
    </Document>
  );
};

// Styles for PDF
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 10,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  roleTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 5,
    paddingTop: 5,
    fontSize: 12,
  },
  columnHeader: {
    fontWeight: "bold",
    flexBasis: "70%",
  },
  columnHeaderAnswer: {
    fontWeight: "bold",
    flexBasis: "30%",
  },
  cell: {
    flexBasis: "70%",
  },
  answerCell: {
    flexBasis: "30%",
  },
});

const PdfDownloadButton = ({
  userAnswersForRole,
}: {
  userAnswersForRole: PdfTransformedData[];
}) => {
  return (
    <div>
      <div className="mt-5 flex items-center justify-around gap-6">
        <Link href="/survey/general" passHref>
          <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
            <ArrowLeft />
            Go back to Survey
          </Button>
        </Link>
        {/* Add a download link/button */}
        {userAnswersForRole && (
          <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
            {/* Hidden PDFDownloadLink */}
            <PDFDownloadLink
              className="download-link"
              document={<PDFDocument userAnswersForRole={userAnswersForRole} />}
              fileName="info_support_tech_survey_results.pdf"
            >
              {({ loading }) =>
                loading ? "Loading document..." : "Download results as PDF"
              }
            </PDFDownloadLink>
            <ArrowRight />
          </Button>
        )}
      </div>
    </div>
  );
};

export default PdfDownloadButton;
