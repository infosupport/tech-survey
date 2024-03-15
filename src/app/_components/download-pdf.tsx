"use client";

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { idToAnswerMap } from "~/utils/optionMapping";
import { type TransformedData } from "~/models/types";

import dynamic from "next/dynamic";

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
      <div>
        {/* Add a download link/button */}
        {userAnswersForRole && (
          <PDFDownloadLink
            document={<MyPDFDocument userAnswersForRole={userAnswersForRole} />}
            fileName="question_results.pdf"
          >
            {({ loading }) =>
              loading ? "Loading document..." : "Download PDF"
            }
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default MyComponent;
