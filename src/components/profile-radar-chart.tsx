"use client";

import {
    Legend,
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
    ResponsiveContainer,
} from "recharts";
import React from "react";

function ProfileRadarChart({
    data,
}: {
    data: {
        role: string;
        sum: number;
    }[];
}) {
    return (
        <ResponsiveContainer width="100%" height={400}>
            <RadarChart
                data={data}
                margin={{
                    top: 20,
                    right: 20,
                    left: 20,
                    bottom: 20,
                }}
            >
                <PolarGrid />
                <PolarAngleAxis dataKey="role" />
                <Radar
                    name="2024"
                    dataKey="sum"
                    stroke="#58508d"
                    fill="#58508d"
                    fillOpacity={0.75}
                />
                <Legend />
            </RadarChart>
        </ResponsiveContainer>
    );
}

export default ProfileRadarChart;
