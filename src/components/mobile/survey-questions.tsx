"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

import { InfoCircledIcon } from "@radix-ui/react-icons";

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

import { idToMoreInfo, idToTextMap } from "~/utils/option-mapping";

import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";

export function MobileSurveyQuestionnaire({
    userId,
    questions,
    answerOptions,
    form,
    saveAnswer,
}: {
    userId: string;
    questions: Question[];
    answerOptions: AnswerOption[];
    form: ReturnType<typeof useForm>;
    saveAnswer: (answer: SurveyResponse) => void;
}) {
    return (
        <div>
            {questions?.map((question) => (
                <div key={question.id} className="mx-auto w-full">
                    <FormField
                        control={form.control}
                        name={question.id}
                        key={`${question.id}`}
                        render={({ field }) => (
                            <Card
                                id={question.id}
                                className={`mt-4 border-2 ${form.formState.errors[question.id] ? "border-red-500" : "border-gray-200 dark:border-slate-900"}`}
                            >
                                <CardHeader>
                                    <CardTitle>
                                        {question.questionText}
                                        <FormMessage />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {answerOptions.map((option) => (
                                        <FormItem key={option.id}>
                                            <FormControl>
                                                <RadioGroup
                                                    onValueChange={async (
                                                        value,
                                                    ) => {
                                                        field.onChange(value);
                                                        saveAnswer({
                                                            userId: userId,
                                                            questionId:
                                                                question.id,
                                                            answerId: value,
                                                        });
                                                    }}
                                                    value={
                                                        field.value as string
                                                    }
                                                    className="flex flex-col space-y-1"
                                                >
                                                    <label
                                                        className={`flex cursor-pointer items-center space-x-2 rounded-lg p-2 ${
                                                            field.value ===
                                                            option.id
                                                                ? "bg-custom-selectedLight dark:bg-custom-selected"
                                                                : "hover:bg-gray-100 dark:hover:bg-slate-900"
                                                        }`}
                                                    >
                                                        <FormControl>
                                                            <RadioGroupItem
                                                                value={
                                                                    option.id
                                                                }
                                                                checked={
                                                                    field.value ===
                                                                    option.id
                                                                }
                                                            />
                                                        </FormControl>
                                                        <div className="flex items-center">
                                                            <span className="text-gray-900 dark:text-white">
                                                                {
                                                                    idToTextMap[
                                                                        option
                                                                            .option
                                                                    ]
                                                                }
                                                            </span>

                                                            <Popover>
                                                                <PopoverTrigger
                                                                    asChild
                                                                >
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                    >
                                                                        <InfoCircledIcon />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="flex justify-between space-x-4">
                                                                        <div className="space-y-1">
                                                                            <p className="text-sm font-normal">
                                                                                {
                                                                                    idToMoreInfo[
                                                                                        option
                                                                                            .option
                                                                                    ]
                                                                                }
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        </div>
                                                    </label>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    />
                </div>
            ))}
        </div>
    );
}
