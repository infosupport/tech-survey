import Link from "next/link";
import { Fragment } from "react";
import { type Section } from "~/models/types";
import { progressionInfo } from "~/utils/survey-utils";

const ProgressionBar = ({
    roles,
    percentCompletedPerRole,
}: {
    roles: Section[];
    percentCompletedPerRole: Record<
        string,
        { totalQuestions: number; answeredQuestions: number }
    >;
}) => {
    const { progressPercentage } = progressionInfo(percentCompletedPerRole);

    return (
        <nav
            className="relative mt-8 p-4"
            style={{ padding: "100px 40px 40px" }}
        >
            <div className="mt-4">
                {/* Progress bar */}
                <div
                    className="flex items-center justify-between"
                    style={{ width: "90%" }}
                >
                    {" "}
                    {roles.map((section, index) => (
                        <Fragment key={section.id}>
                            {/* Circle with clickable area */}
                            <div className="relative flex items-center justify-center">
                                {section.currentCompleted ? (
                                    <Link
                                        type="submit"
                                        href={section.href}
                                        className="flex items-center justify-center"
                                    >
                                        <div
                                            className={`mb-1 h-6 w-6 rounded-full border-2 ${
                                                section.current
                                                    ? "border-custom-secondary bg-custom-primary dark:border-custom-primary dark:bg-custom-secondary"
                                                    : section.completed
                                                      ? "border-green-500 bg-green-500"
                                                      : section.started
                                                        ? "border-orange-500 bg-orange-500"
                                                        : "border-gray-300"
                                            }`}
                                        ></div>
                                        <div
                                            className="absolute -rotate-45 whitespace-nowrap text-xs font-semibold"
                                            style={{
                                                transformOrigin: "bottom left",
                                                top: "-22px",
                                                left: "calc(100% - 0px)",
                                            }}
                                        >
                                            {section.label}
                                        </div>
                                    </Link>
                                ) : (
                                    <div>
                                        <div
                                            className={`mb-1 h-6 w-6 rounded-full border-2 ${
                                                section.current
                                                    ? "border-custom-secondary bg-custom-primary dark:border-custom-primary dark:bg-custom-secondary"
                                                    : section.completed
                                                      ? "border-green-500 bg-green-500"
                                                      : section.started
                                                        ? "border-orange-500 bg-orange-500"
                                                        : "border-gray-300"
                                            }`}
                                        ></div>
                                        <div
                                            className="absolute -rotate-45 whitespace-nowrap text-xs font-semibold"
                                            style={{
                                                transformOrigin: "bottom left",
                                                top: "-22px",
                                                left: "calc(100% - 0px)",
                                            }}
                                        >
                                            {section.label}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Line (except for the last section) */}
                            {index !== roles.length - 1 && (
                                <div
                                    className={`mx-2 h-0.5 flex-1 ${
                                        section.completed &&
                                        roles[index + 1]?.completed
                                            ? "bg-green-500"
                                            : "bg-gray-300"
                                    }`}
                                ></div>
                            )}
                        </Fragment>
                    ))}
                </div>
            </div>
            <div className="flex items-center justify-between">
                <h3 className="hidden text-lg font-semibold">Progress</h3>
                <span className="text-sm">
                    {progressPercentage.toFixed(2)}% Completed
                </span>
            </div>
        </nav>
    );
};

export default ProgressionBar;
