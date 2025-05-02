"use client";
import { api } from "~/trpc/react";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { UploadIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "~/components/ui/use-toast";
import { newSurveyObject } from "~/app/survey/upload/newSurveyObject";
import Papa from "papaparse";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

function SurveyUpload() {
    const [surveyDate, setSurveyDate] = useState<Date>(new Date());
    const [surveyName, setSurveyName] = useState<string>("");
    const { mutate, isPending, isSuccess, isError, error } =
        api.surveys.uploadNewSurvey.useMutation();
    const uploadFile = async (file: File) => {
        const fileContent = await file.text();
        const parseResult = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
        });

        if (parseResult.errors && parseResult.errors.length > 0) {
            toast({
                title: "Survey upload failed",
                description: `There was an error uploading the survey: ${parseResult.errors[0]!.message}`,
                variant: "destructive",
            });
            return;
        }

        const csvData = parseResult.data as Array<Record<string, string>>;

        const survey: {
            surveyDate: string;
            surveyName: string;
            questions: {
                questionText: string;
                roles: {
                    role: string;
                    isDefault: boolean;
                }[];
            }[];
        } = {
            surveyDate: surveyDate.toDateString(),
            surveyName: surveyName,
            questions: [],
        };
        const headers = Object.keys(csvData[0] ?? {});
        const firstHeader = headers[0] ?? "Technologie";

        for (const row of csvData) {
            const questionText = row[firstHeader] ?? "";
            const applicableRoles = Object.keys(row).filter((role) => {
                if (!row[role]) {
                    return false;
                }
                return (
                    row[role].toLowerCase() === "x" && role !== "Technologie"
                );
            });

            const question = {
                questionText,
                roles: applicableRoles.map((role) => ({
                    role: role,
                    isDefault: role === "General",
                })),
            };
            survey.questions.push(question);
        }

        // validate the file content
        const surveyData = newSurveyObject.parse(survey);

        mutate({
            surveyDate: surveyData.surveyDate.toDateString(),
            surveyName: surveyData.surveyName,
            questions: surveyData.questions,
        });
    };

    useEffect(() => {
        toast({
            title: "Survey uploaded",
            description: "The survey has been uploaded successfully",
            variant: "default",
        });
    }, [isSuccess]);

    useEffect(() => {
        if (isError) {
            toast({
                title: "Survey upload failed",
                description: `There was an error uploading the survey: ${error?.message}`,
                variant: "destructive",
            });
        }
    }, [isError, error]);

    return (
        <div className="mb-4 flex flex-col items-center">
            <h1 className="text-3xl font-bold">Upload a survey</h1>
            <p className="text-center text-xl">
                Upload a survey in CSV format to add a new survey. If you want
                to use the current survey as a base for the new survey, you can
                extract the current survey to a JSON file using the{" "}
                <code>survey-to-csv.ts</code> script.
            </p>
            <div className="mb-10 mt-10 grid grid-cols-6 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <Label className="text-nowrap">Survey date:</Label>
                    <Input
                        placeholder="Survey date"
                        type="date"
                        value={surveyDate.toISOString().split("T")[0]}
                        onChange={(e) => {
                            setSurveyDate(new Date(e.target.value));
                        }}
                    />
                </div>
                <div className="sm:col-span-3">
                    <Label className="text-nowrap">Survey name:</Label>
                    <Input
                        placeholder="Survey name"
                        value={surveyName}
                        onChange={(e) => {
                            setSurveyName(e.target.value);
                        }}
                    />
                </div>
            </div>
            <p className="mb-5 text-center text-xl">
                A header row is required. The first column should be the
                question text. An X in other columns indicates that the question
                is applicable to the role in that column.
            </p>
            <label
                htmlFor="survey_upload"
                className={`${cn(buttonVariants({ className: "w-1/10 cursor-pointer bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover" }))}`}
            >
                Upload survey{" "}
                {isPending ? (
                    <Loader2 className="ml-1 h-4 w-4 animate-spin" />
                ) : (
                    <UploadIcon className="ml-1" />
                )}
            </label>
            <input
                id="survey_upload"
                type="file"
                hidden
                accept=".csv"
                onChange={(e) => {
                    if (
                        e.target.files === null ||
                        e.target.files.length === 0
                    ) {
                        return;
                    }
                    return uploadFile(e.target.files[0]!);
                }}
            />
        </div>
    );
}

export default SurveyUpload;
