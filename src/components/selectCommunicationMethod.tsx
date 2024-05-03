"use client";

import { CommunicationMethod } from "@prisma/client";
import { type Session } from "next-auth";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export default function SelectCommunicationMethod({
  session,
  methods,
}: {
  session: Session;
  methods: string[];
}) {
  const [selectedMethods, setSelectedMethods] = useState<CommunicationMethod[]>(
    [],
  );

  const { mutate: setMethodMutate } =
    api.survey.setCommunicationMethods.useMutation();

  // If we have multiple selected role, we get `"SLACK,SIGNAL,TEAMS"` as a string
  // We need to split this string into an array of strings
  useEffect(() => {
    if (methods.length > 0) {
      const splitMethods = (methods[0] ?? "").split(",");
      setSelectedMethods(splitMethods as CommunicationMethod[]);
    }
  }, [methods]);

  const handleMethodChange = (method: CommunicationMethod) => {
    let updatedSelection;

    if (!selectedMethods.includes(method)) {
      updatedSelection = [...selectedMethods, method];
    } else {
      updatedSelection = selectedMethods.filter((m) => m !== method);
    }
    setSelectedMethods(updatedSelection);
    setMethodMutate({
      userId: session.user.id,
      methods: updatedSelection,
    });
  };

  return (
    <div className="mx-auto py-8">
      <h2 id="select-roles" className="mb-4 text-2xl font-bold">
        Select communication preference
      </h2>
      <p>
        Please select your preferred method of communication. You can select
        more than one.
      </p>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Loop through all available communication methods */}
        {Object.values(CommunicationMethod).map((method) => (
          <li
            key={method}
            className={`cursor-pointer rounded-lg border p-4 hover:bg-gray-400 hover:bg-opacity-25 dark:hover:bg-gray-800`}
            onClick={() => handleMethodChange(method)}
          >
            <input
              type="checkbox"
              checked={selectedMethods.includes(method)}
              onChange={() => handleMethodChange(method)}
              className={`mr-2 accent-custom-primary`}
            />
            <label className={"cursor-pointer"}>
              {/* Only capitalise the first letter */}
              {method.charAt(0) + method.slice(1).toLowerCase()}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
