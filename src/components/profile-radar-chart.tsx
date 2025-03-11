"use client";

import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from "recharts";
import React, { useCallback, useMemo } from "react";

export type ProfileRadarChartRoleData = { role: string } & {
    [surveyName in string]: number;
};

type ProfileRadarChartProps = {
    roleData: ProfileRadarChartRoleData[];
    surveyNames: string[];
};

function ProfileRadarChart({ roleData, surveyNames }: ProfileRadarChartProps) {
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

    return (
        <ResponsiveContainer width="100%" height={400}>
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
                            activeSurveys.includes(index) ? "block" : "none"
                        }
                    />
                ))}
                <Legend onClick={(e) => handleLegendClick(e.value)} />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export default ProfileRadarChart;
