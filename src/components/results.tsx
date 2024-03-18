"use client";

import { type TransformedData } from "~/models/types";
import ShowResults from "./show-results";

export default function ResultsWrapper({ data }: { data: TransformedData }) {
  return (
    <div>
      <ShowResults data={data} />
    </div>
  );
}

export function ResultCommons({ data }: { data: TransformedData }) {
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
          <div
            className="custom-tooltip dark:bg-slate-700"
            style={customTooltipStyle}
          >
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

  return { uniqueDataKeys, dataKeyColors, CustomTooltip };
}
