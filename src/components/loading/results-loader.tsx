"use client";

import { ResponsiveContainer } from "recharts";

const LegendSkeleton = () => {
    return (
        <div className="grid gap-4">
            <h2 className="mb-4 animate-pulse text-lg font-semibold">Legend</h2>
            <div className="flex flex-wrap gap-4">
                {[...Array<number>(5)].map((_, index) => (
                    <div key={index} className="flex items-center">
                        <div className="mr-4 h-6 w-6 animate-pulse rounded-full bg-gray-300"></div>
                        <span className="h-6 w-24 animate-pulse bg-gray-300"></span>
                    </div>
                ))}
            </div>
            {[...Array<number>(3)].map((_, index) => (
                <div key={index} className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-md p-4 shadow-md">
                        <h3 className="mb-4 animate-pulse text-lg font-medium">
                            Question
                        </h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <div className="h-full w-full animate-pulse bg-gray-300"></div>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="rounded-md p-4 shadow-md">
                        <h3 className="mb-4 animate-pulse text-lg font-medium">
                            Question
                        </h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <div className="h-full w-full animate-pulse bg-gray-300"></div>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default LegendSkeleton;
