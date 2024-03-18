"use client";

import { notFound, usePathname } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { slugToId, slugify } from "~/utils/slugify";

type TransformedData = Record<string, Record<string, Record<string, number>>>;

const MobileShowResults = ({ data }: { data: TransformedData }) => {
  const pathname = usePathname() || "";

  const currentRole = pathname.split("/").pop() ?? "";
  if (!slugToId[currentRole]) {
    notFound();
  }

  // Define a color palette, which is friendly to colorblind people.
  const colorPalette = ["#003f5c", "#58508d", "#bc5090", "#ff6361", "#ffa600"];

  // Get unique data keys for legend
  const dataKeys = Object.values(data).flatMap((questions) =>
    Object.values(questions).flatMap((answers) => Object.keys(answers)),
  );
  const uniqueDataKeys = Array.from(new Set(dataKeys));

  const dataKeyColors = uniqueDataKeys.reduce<Record<string, string>>(
    (acc, dataKey, index) => {
      acc[dataKey] = colorPalette[index % colorPalette.length]!;
      return acc;
    },
    {},
  );

  const customTooltipStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "1px solid #ccc",
    borderRadius: "4px",
    padding: "8px",
    fontSize: "14px",
  };

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active: boolean;
    payload: { name: string; value: number }[];
  }) => {
    if (active && payload?.length) {
      return (
        <div>
          <div className="custom-tooltip" style={customTooltipStyle}>
            <p className="label dark:text-black">
              {payload.map((entry, index) => (
                <span key={`item-${index}`}>
                  {`${entry.name} : ${entry.value}`}
                </span>
              ))}
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <h2 className="mb-4 text-lg font-semibold">Legend</h2>
      <div className="flex flex-wrap gap-2">
        {uniqueDataKeys.map((dataKey, index) => (
          <div key={index} className="flex items-center">
            <div
              className="mr-2 h-4 w-4 rounded-full"
              style={{ backgroundColor: dataKeyColors[dataKey]! }}
            ></div>
            <span>{dataKey}</span>
          </div>
        ))}
      </div>

      {Object.entries(data).map(([role, questions]) => {
        // Only show the results for the current role
        if (slugify(role) === currentRole) {
          return (
            <div key={role} className="grid gap-4 md:grid-cols-2">
              {Object.entries(questions).map(([question, answers]) => (
                <div key={question} className="rounded-md p-4 shadow-md">
                  <h3 className="mb-2 text-base font-medium">{question}</h3>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={[{ name: "Skill level", ...answers }]}
                        margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          label={{
                            value: "Number of responses",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          content={
                            <CustomTooltip active={false} payload={[]} />
                          }
                        />
                        {uniqueDataKeys.map((dataKey, index) => (
                          <Bar
                            key={index}
                            dataKey={dataKey}
                            fill={dataKeyColors[dataKey]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null; // Returning null for roles that don't match currentRole
      })}
    </div>
  );
};

export default MobileShowResults;
