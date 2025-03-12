"use client";
import { api } from "~/trpc/react";
import { z } from "zod";
import { buttonVariants } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { UploadIcon } from "@radix-ui/react-icons";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { toast } from "~/components/ui/use-toast";

const newSurveyObject = z.object({
    surveyDate: z.string().transform((val) => new Date(val)),
    surveyName: z.string(),
    questions: z.array(
        z.object({
            questionText: z.string(),
            roles: z.array(
                z.object({
                    id: z.string(),
                    role: z.string(),
                    default: z.boolean(),
                }),
            ),
        }),
    ),
});

function SurveyUpload() {
    // A component to upload a json file and then using the content, call the uploadNewSurvey mutation
    const { mutate, isPending, isSuccess, isError, error } =
        api.surveys.uploadNewSurvey.useMutation();
    const uploadFile = async (file: File) => {
        const fileContent = await file.text();
        // validate the file content
        const surveyData = newSurveyObject.parse(JSON.parse(fileContent));

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
                Upload a survey in JSON format to add a new survey. If you want
                to use the current survey as a base for the new survey, you can
                extract the current survey to a JSON file using the{" "}
                <code>survey-to-json.ts</code> script.
            </p>
            <p className="text-center text-xl">
                The survey should have the following format:
            </p>
            <pre className="text-left">
                {`
                {
                    surveyDate: "2021-09-01",
                    surveyName: "Unique survey name",
                    questions: [
                        {
                            questionText: "What is your name?",
                            roles: [
                                {
                                    id: "1",
                                    role: "General",
                                    default: true,
                                },
                            ],
                        }
                    ]
                }
                `}
            </pre>
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
                multiple
                hidden
                accept=".json"
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
