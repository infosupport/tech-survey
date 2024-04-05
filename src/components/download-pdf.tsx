/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { idToTextMap } from "~/utils/optionMapping";
import { type AnswerOption, type PdfTransformedData } from "~/models/types";

import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "./svg";
import { type Session } from "next-auth";

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
  answerOptions,
  session,
}: {
  userAnswersForRole: PdfTransformedData[];
  answerOptions: AnswerOption[];
  session: Session;
}) => {
  const rolesIncluded: Record<string, boolean> = {};

  function getOptionFromAnswerId(answerId: string): string {
    const answerOption = answerOptions.find((option) => option.id === answerId);
    return answerOption
      ? idToTextMap[answerOption.option] ?? ""
      : "Option not found";
  }

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
    const positionA = answerOptions.findIndex(
      (option) => option.id === a.answerId,
    );
    const positionB = answerOptions.findIndex(
      (option) => option.id === b.answerId,
    );

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
      {/* Display participant name on the first page only */}
      <Page key="firstPage" style={styles.page}>
        <View style={styles.sectionFirstPage}>
          <View style={styles.centered}>
            <Text style={styles.title}>
              <Text style={styles.infoSupport}>Info Support</Text> Tech Survey
              2024
            </Text>
            <Text style={styles.subtitle}>
              Results for: {session.user?.name ?? "Name not found"}
            </Text>
            <Text style={styles.subsubtitle}>
              Last updated: {new Date().toLocaleDateString("nl-NL")}
            </Text>
          </View>
        </View>
      </Page>

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
                          {answers.length > 0
                            ? getOptionFromAnswerId(answers[0]?.answerId ?? "")
                            : ""}
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
  sectionFirstPage: {
    // Styles for the section/container
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centered: {
    // Styles for centering content vertically
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    // Styles for the title
    fontSize: 32, // Adjust size as needed
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10, // Adjust spacing between title and subtitle
  },
  subtitle: {
    // Styles for the subtitle
    fontSize: 20, // Adjust size as needed
    textAlign: "center",
  },
  subsubtitle: {
    // Styles for the subtitle
    fontSize: 14, // Adjust size as needed
    textAlign: "center",
  },
  infoSupport: {
    // Styles for the "Info Support" text
    color: "rgb(0, 163, 224)",
  },
});

const PdfDownloadButton = ({
  userAnswersForRole,
  answerOptions,
  session,
}: {
  userAnswersForRole: PdfTransformedData[];
  answerOptions: AnswerOption[];
  session: Session;
}) => {
  return (
    <div>
      <div className="mt-5 flex items-center justify-around gap-6">
        <Link href="/" passHref>
          <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
            <ArrowLeft />
            Go back to home
          </Button>
        </Link>
        {/* Add a download link/button */}
        {userAnswersForRole && (
          <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
            {/* Hidden PDFDownloadLink */}
            <PDFDownloadLink
              className="download-link"
              document={
                <PDFDocument
                  userAnswersForRole={userAnswersForRole}
                  answerOptions={answerOptions}
                  session={session}
                />
              }
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
