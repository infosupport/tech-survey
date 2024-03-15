"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { idToAnswerMap } from "~/utils/optionMapping";
import { type TransformedData } from "~/models/types";

import dynamic from "next/dynamic";
import { Button } from "~/components/ui/button";
import Link from "next/link";

const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <p>Loading...</p>,
  },
);

const MyPDFDocument = ({
  userAnswersForRole,
}: {
  userAnswersForRole: TransformedData[];
}) => (
  <Document>
    {/* Group userAnswersForRole by role */}
    {userAnswersForRole
      .reduce<{ id: string; data: TransformedData[] }[]>(
        (acc, { question, answers }) => {
          const roleId =
            question.roles && question.roles.length > 0
              ? question.roles[0]?.id ?? ""
              : "";

          const existingRole = acc.find((role) => role.id === roleId);

          if (existingRole) {
            // If the role already exists, add the question and its answers to its data
            existingRole.data.push({ question, answers });
          } else {
            // If the role doesn't exist, create a new role object with the question and its answers
            acc.push({
              id: roleId,
              data: [{ question, answers }],
            });
          }

          return acc;
        },
        [],
      )

      .map(({ id, data }) => (
        <Page key={id} style={styles.page}>
          <View style={styles.section}>
            {/* Role Name */}
            <Text style={styles.roleTitle}>
              Role: {data[0]?.question?.roles?.[0]?.role}
            </Text>
            {/* Table Header */}
            <View style={styles.tableRow}>
              <Text style={styles.columnHeader}>Question</Text>
              <Text style={styles.columnHeader}>Answer</Text>
            </View>
            {/* Iterate over questions and answers */}
            {data.map(({ question, answers }) => (
              <View key={question?.id}>
                {/* Render the question */}
                <View style={styles.tableRow}>
                  <Text style={styles.cell}>
                    {question?.questionText || "Question not found"}
                  </Text>
                  {/* Render the answer */}
                  <Text style={styles.cell}>
                    {answers
                      .map(({ answerId }) => idToAnswerMap[answerId])
                      .join(", ")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
  </Document>
);

// Styles for PDF
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
  },
  columnHeader: {
    fontWeight: "bold",
    flexBasis: "50%",
  },
  cell: {
    flexBasis: "50%",
  },
});

// Define the react component with the TransformedData type
const MyComponent = ({
  userAnswersForRole,
}: {
  userAnswersForRole: TransformedData[];
}) => {
  return (
    <div>
      <div className="mt-5 flex items-center justify-around gap-6">
        <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary">
          <Link href="/survey/general" passHref>
            Go back to Survey
          </Link>
        </Button>
        {/* Add a download link/button */}
        {userAnswersForRole && (
          <Button className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary">
            {/* Hidden PDFDownloadLink */}
            <PDFDownloadLink
              className="download-link"
              document={
                <MyPDFDocument userAnswersForRole={userAnswersForRole} />
              }
              fileName="question_results.pdf"
            >
              {({ loading }) =>
                loading ? "Loading document..." : "Download PDF"
              }
            </PDFDownloadLink>
            <svg
              className="arrow-right ml-2"
              width="10"
              height="10"
              viewBox="0 0 4 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                id="Vector"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.39352 3.60724H3.60801V2.39278H2.39352V3.60724Z"
                fill="#003865"
              ></path>
              <path
                id="Vector_2"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.19662 4.80365H2.41102V3.58923H1.19662V4.80365Z"
                fill="#003865"
              ></path>
              <path
                id="Vector_3"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M1.19662 2.41089H2.41102V1.19641H1.19662V2.41089Z"
                fill="#003865"
              ></path>
              <path
                id="Vector_4"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 6H1.21442V4.78559L0 4.78558L0 6Z"
                fill="#003865"
              ></path>
              <path
                id="Vector_5"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M0 1.21448H1.21442V9.50098e-05L0 -5.24521e-06L0 1.21448Z"
                fill="#003865"
              ></path>
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
};

export default MyComponent;
