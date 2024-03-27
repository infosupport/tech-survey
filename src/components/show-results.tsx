"use client";

import { usePathname } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { type TransformedData } from "~/models/types";
import { slugify } from "~/utils/slugify";
import { ResultCommons } from "./results";
import { idToTextMap } from "~/utils/optionMapping";
import renderNotFoundPage from "~/app/[...not_found]/page";

const ShowResults = ({ data }: { data: TransformedData }) => {
  const pathname = usePathname() || "";

  const currentRole = pathname.split("/").pop() ?? "";

  const roleExists = Object.keys(data).some(
    (role) => slugify(role) === currentRole,
  );
  if (!roleExists) {
    return renderNotFoundPage();
  }

  const { uniqueDataKeys, dataKeyColors, CustomTooltip } = ResultCommons({
    data,
  });

  // sort the uniqueDataKeys based on the order of the dataKeys
  uniqueDataKeys.sort((a, b) => {
    const aIndex = Object.keys(idToTextMap).indexOf(a);
    const bIndex = Object.keys(idToTextMap).indexOf(b);
    return aIndex - bIndex;
  });

  return (
    <div className="grid gap-4">
      <h2 className="mb-4 text-lg font-semibold">Legend</h2>
      <div className="flex flex-wrap gap-2">
        {uniqueDataKeys.map((dataKey, index) => (
          <div key={index} className="flex items-center">
            <div
              className="mr-2 h-4 w-4 rounded-full"
              style={{ backgroundColor: dataKeyColors[dataKey] }}
            ></div>
            <span>{idToTextMap[+dataKey]}</span>
          </div>
        ))}
      </div>
      {Object.entries(data).map(([role, questions]) => {
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
        return null;
      })}
    </div>
  );
};

export default ShowResults;
