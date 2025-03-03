"use client";

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "~/components/ui/hover-card";

import {
    type AnswerOption,
    type Question,
    type SurveyResponse,
} from "~/models/types";

import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "~/components/ui/form";

import { idToMoreInfo, idToTextMap } from "~/utils/optionMapping";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { type useForm } from "react-hook-form";
import { findAnswerId } from "~/utils/survey-utils";
import { useEffect, useRef } from "react";

export function SurveyQuestions({
    userId,
    questions,
    answerOptions,
    form,
    saveAnswer,
    currentAnswers,
}: {
    userId: string;
    questions: Question[];
    answerOptions: AnswerOption[];
    form: ReturnType<typeof useForm>;
    saveAnswer: (answer: SurveyResponse) => void;
    currentAnswers: SurveyResponse[];
}) {
    const tableRef = useRef<HTMLTableElement>(null);
    const currentRowIndex = useRef<number>(1);
    const currentCellIndex = useRef<number>(1);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowDown") {
                if (currentRowIndex.current < questions.length) {
                    currentRowIndex.current++;
                    focusCell();
                }
            } else if (event.key === "ArrowUp") {
                if (currentRowIndex.current > 1) {
                    currentRowIndex.current--;
                    focusCell();
                }
            } else if (event.key === "ArrowRight") {
                if (currentCellIndex.current < answerOptions.length) {
                    currentCellIndex.current++;
                    focusCell();
                }
            } else if (event.key === "ArrowLeft") {
                if (currentCellIndex.current > 1) {
                    currentCellIndex.current--;
                    focusCell();
                }
            } else if (event.key === "Enter" || event.key === " ") {
                selectCell();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        currentRowIndex,
        currentCellIndex,
        questions.length,
        answerOptions.length,
    ]);

    const focusCell = () => {
        if (tableRef.current) {
            const rows = tableRef.current.querySelectorAll("tr");
            const cells = rows[currentRowIndex.current]?.querySelectorAll("td");

            // Remove outline class from previously focused button
            const previousButton = tableRef.current.querySelector(".outline");
            previousButton?.classList.remove("outline");

            // find the button in the cell
            const button =
                cells?.[currentCellIndex.current]?.querySelector("button");

            // remove the outline:focus-none class from the button
            button?.classList.remove("outline-none");

            // add the outline class to the button
            button?.classList.add("outline");
            button?.classList.add("outline-1");
        }
    };

    const selectCell = () => {
        if (tableRef.current) {
            const rows = tableRef.current.querySelectorAll("tr");
            const cells = rows[currentRowIndex.current]?.querySelectorAll("td");

            const button =
                cells?.[currentCellIndex.current]?.querySelector("button");

            button?.focus();
            button?.click();
        }
    };

    return (
        <>
            <Table
                ref={tableRef}
                className="overflow-hidden rounded-lg shadow-md "
            >
                <TableHeader className="sticky top-0 z-10 h-10 w-full bg-slate-100 dark:bg-slate-900">
                    <TableRow>
                        <TableHead className="w-[400px]">Question</TableHead>
                        {answerOptions.map((option) => (
                            <TableHead className="text-center" key={option.id}>
                                <HoverCard>
                                    <HoverCardTrigger asChild>
                                        <div className="flex items-center">
                                            <span
                                                style={{
                                                    flex: 1,
                                                    textAlign: "center",
                                                }}
                                            >
                                                {idToTextMap[option.option]}
                                            </span>
                                            <InfoCircledIcon className="ml-2 h-4 w-4" />
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80">
                                        <div className="flex justify-between space-x-4">
                                            <div className="space-y-1">
                                                <p className="text-sm font-normal">
                                                    {
                                                        idToMoreInfo[
                                                            option.option
                                                        ]
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {questions?.map((question, questionIndex) => (
                        <FormField
                            control={form.control}
                            name={question.id}
                            key={`${question.id}`}
                            render={({ field }) => (
                                <TableRow
                                    key={question.id}
                                    id={question.id}
                                    className={`${
                                        form.formState.errors[question.id]
                                            ? "error !border-2 !border-dashed !border-red-500"
                                            : ""
                                    } ${
                                        questionIndex % 2 === 0
                                            ? "bg-slate-50 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-600"
                                            : "bg-slate-100 hover:bg-slate-300 dark:bg-slate-900 dark:hover:bg-slate-700"
                                    }`}
                                >
                                    <TableCell className="pl-2">
                                        {question.questionText}
                                        <FormMessage />
                                    </TableCell>
                                    {answerOptions.map((option) => (
                                        <TableCell
                                            key={option.id}
                                            className={`w-[300px] `}
                                        >
                                            <label
                                                className={`${
                                                    field.value === option.id ||
                                                    findAnswerId(
                                                        currentAnswers,
                                                        question.id,
                                                    ) === option.id
                                                        ? "rounded-lg border-2 border-custom-selected "
                                                        : ""
                                                }flex h-[40px] cursor-pointer items-center justify-center`}
                                            >
                                                <FormItem>
                                                    <FormControl>
                                                        <RadioGroup
                                                            onValueChange={async (
                                                                value,
                                                            ) => {
                                                                field.onChange(
                                                                    value,
                                                                );
                                                                saveAnswer({
                                                                    id: question
                                                                        .QuestionResult?.[0]
                                                                        ?.id,
                                                                    userId: userId,
                                                                    questionId:
                                                                        question.id,
                                                                    answerId:
                                                                        value,
                                                                });
                                                                currentRowIndex.current =
                                                                    questionIndex +
                                                                    1;
                                                                currentCellIndex.current =
                                                                    answerOptions.findIndex(
                                                                        (
                                                                            option,
                                                                        ) =>
                                                                            option.id ===
                                                                            value,
                                                                    ) + 1;
                                                            }}
                                                            value={
                                                                field.value as string
                                                            }
                                                            className="flex flex-col space-y-1"
                                                        >
                                                            <FormControl>
                                                                <RadioGroupItem
                                                                    value={
                                                                        option.id
                                                                    }
                                                                    checked={
                                                                        field.value ===
                                                                            option.id ||
                                                                        findAnswerId(
                                                                            currentAnswers,
                                                                            question.id,
                                                                        ) ===
                                                                            option.id
                                                                    }
                                                                />
                                                            </FormControl>
                                                        </RadioGroup>
                                                    </FormControl>
                                                </FormItem>
                                            </label>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            )}
                        />
                    ))}
                </TableBody>
            </Table>
        </>
    );
}
