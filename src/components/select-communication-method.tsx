"use client";

import { CommunicationMethod } from "@prisma/client";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import communicationMethodToIcon from "~/components/ui/CommunicationMethodToIcon";

export default function SelectCommunicationMethod({
    userId,
    methods,
    setCommunicationMethodIsLoading,
}: {
    userId: string;
    methods: CommunicationMethod[];
    setCommunicationMethodIsLoading(value: boolean): void;
}) {
    const [selectedMethods, setSelectedMethods] =
        useState<CommunicationMethod[]>(methods);

    useEffect(() => {
        setSelectedMethods(methods);
    }, [methods]);

    const { mutate: setMethodMutate, isPending: setMethodIsLoading } =
        api.survey.setCommunicationMethods.useMutation();

    useEffect(() => {
        setCommunicationMethodIsLoading(setMethodIsLoading);
    }, [setCommunicationMethodIsLoading, setMethodIsLoading]);

    const handleMethodChange = (method: CommunicationMethod) => {
        let updatedSelection: CommunicationMethod[];

        if (!selectedMethods.includes(method)) {
            updatedSelection = [...selectedMethods, method];
        } else {
            updatedSelection = selectedMethods.filter((m) => m !== method);
        }

        setSelectedMethods(updatedSelection);
        setMethodMutate({
            userId: userId,
            methods: updatedSelection,
        });
    };

    return (
        <div className="mx-auto py-8">
            <h2 id="select-roles" className="mb-4 text-2xl font-bold">
                Select communication preference
            </h2>
            <p className="text-md mb-8">
                We encourage you to include your{" "}
                <strong>preferred means of communication</strong>&mdash;such as
                email, phone, or messaging platform&mdash;so that colleagues
                seeking experts in specific skills can easily reach out to you
                with any inquiries they may have. You can opt to not share your
                communication preferences. In this case a &apos;Do not
                contact&apos; message will be displayed to your colleagues in
                the &apos;find the expert&apos; section.
            </p>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Loop through all available communication methods */}
                {Object.values(CommunicationMethod).map((method) => (
                    <li
                        key={method}
                        className={`flex cursor-pointer rounded-lg border p-4 hover:bg-gray-400 hover:bg-opacity-25 dark:hover:bg-gray-800`}
                        onClick={() => handleMethodChange(method)}
                    >
                        <input
                            type="checkbox"
                            checked={selectedMethods.includes(method)}
                            onChange={() => handleMethodChange(method)}
                            className={`mr-2 accent-custom-primary`}
                        />
                        <label className={"flex cursor-pointer items-center"}>
                            {communicationMethodToIcon[method]}
                            {/* Only capitalize the first letter */}
                            {method.charAt(0) + method.slice(1).toLowerCase()}
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
}
