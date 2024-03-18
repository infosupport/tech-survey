/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { idToAnswerMap } from "~/utils/optionMapping";
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

// TODO: There is currently a bug that causes questions that have multiple roles not to be put into all the roles they belong to.
// Currently they are only put into the first role they belong to.

const MyPDFDocument = ({
  userAnswersForRole,
}: {
  userAnswersForRole: PdfTransformedData[];
}) => (
  <Document>
    {/* Group userAnswersForRole by role */}
    {userAnswersForRole
      .reduce<{ id: string; data: PdfTransformedData[] }[]>(
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
              document={
                <MyPDFDocument userAnswersForRole={userAnswersForRole} />
              }
              fileName="question_results.pdf"
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

export default MyComponent;
