"use client";

import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from "recharts";
import React, { useCallback, useEffect, useMemo, useRef } from "react";

export type ProfileRadarChartRoleData = { role: string } & {
    [surveyName in string]: number;
};

type ProfileRadarChartProps = {
    roleData: ProfileRadarChartRoleData[];
    surveyNames: string[];
};

function ProfileRadarChart({ roleData, surveyNames }: ProfileRadarChartProps) {
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const scrollToCenter = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft =
                (scrollContainerRef.current.scrollWidth -
                    scrollContainerRef.current.clientWidth) /
                2;
        }
    }, []);

    useEffect(() => {
        scrollToCenter();

        window.addEventListener("resize", scrollToCenter);
        return () => window.removeEventListener("resize", scrollToCenter);
    }, [scrollToCenter]);

    const [activeSurveys, setActiveSurveys] = React.useState(
        surveyNames.map((_, index) => index),
    );

    const handleLegendClick = useCallback(
        (surveyName: string) => {
            const index = surveyNames.findIndex((sn) => sn === surveyName);
            setActiveSurveys((prevActiveSurveys) =>
                prevActiveSurveys.includes(index)
                    ? prevActiveSurveys.filter((i) => i !== index)
                    : [...prevActiveSurveys, index],
            );
        },
        [surveyNames, setActiveSurveys],
    );

    const colors = useMemo(
        () =>
            surveyNames.map(
                (_, index) =>
                    `hsl(${(index * 360) / surveyNames.length}, 70%, 50%)`,
            ),
        [surveyNames],
    );

    if (roleData.length === 0 || surveyNames.length === 0) {
        return <h1 className="text-center">No results.</h1>;
    }

    return (
        <div ref={scrollContainerRef} className="mb-4 w-full overflow-x-scroll">
            <div className="min-w-[975px]">
                <ResponsiveContainer height={500} width="100%">
                    <RadarChart
                        data={roleData}
                        margin={{
                            top: 20,
                            right: 20,
                            left: 20,
                            bottom: 20,
                        }}
                    >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="role" />
                        {surveyNames.map((surveyName, index) => (
                            <Radar
                                key={index}
                                name={surveyName}
                                dataKey={surveyName}
                                stroke={colors[index % colors.length]}
                                fill={colors[index % colors.length]}
                                fillOpacity={0.25}
                                display={
                                    activeSurveys.includes(index)
                                        ? "block"
                                        : "none"
                                }
                            />
                        ))}
                        <Legend
                            onClick={(e) => handleLegendClick(String(e.value))}
                        />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default ProfileRadarChart;
