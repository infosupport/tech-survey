import type { BusinessUnit } from "@prisma/client";
import type { Session } from "next-auth";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function SelectBusinessUnit({
  businessUnits,
  userSelectedBusinessUnit,
  session,
}: {
  session: Session;
  businessUnits: BusinessUnit[];
  userSelectedBusinessUnit: BusinessUnit | undefined;
}) {
  const { mutate: setBusinessUnit } = api.survey.setBusinessUnit.useMutation();
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(
    userSelectedBusinessUnit?.id,
  );

  const handleChange = (userId: string, businessUnitId: string) => {
    setSelectedUnit(businessUnitId);
    setBusinessUnit({
      userId: userId,
      businessUnitId: businessUnitId,
    });
  };

  return (
    <>
      <h2 id="select-roles" className="mb-4 text-2xl font-bold">
        Select Business Unit
      </h2>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {businessUnits.map((unit) => (
          <li
            key={unit.id}
            className={`rounded-lg border p-4`}
            onClick={() => handleChange(session.user.id, unit.id)}
          >
            <input
              type="checkbox"
              className={`"cursor-pointer"} mr-2 accent-custom-primary`}
              checked={unit.id === selectedUnit}
              onChange={() => handleChange(session.user.id, unit.id)}
            />

            <label className={"cursor-pointer"} style={{ color: "inherit" }}>
              {unit.unit}
            </label>
          </li>
        ))}
      </ul>
    </>
  );
}
