"use client";

import { CommunicationMethod } from "@prisma/client";
import { type Session } from "next-auth";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
    SlackLogo,
    TeamsLogo,
    EmailLogo,
    PhoneLogo,
    SignalLogo,
    WhatsappLogo,
} from "./svg";

export default function SelectCommunicationMethod({
    session,
    methods,
    setCommunicationMethodIsLoading,
}: {
    session: Session;
    methods: string[];
    setCommunicationMethodIsLoading: (value: boolean) => void;
}) {
    const [selectedMethods, setSelectedMethods] = useState<
        CommunicationMethod[]
    >([]);

    const { mutate: setMethodMutate, isLoading: setMethodIsLoading } =
        api.survey.setCommunicationMethods.useMutation();

    useEffect(() => {
        setCommunicationMethodIsLoading(setMethodIsLoading);
    }, [setCommunicationMethodIsLoading, setMethodIsLoading]);

    // If we have multiple selected role, we get `"SLACK,SIGNAL,TEAMS"` as a string
    // We need to split this string into an array of strings
    useEffect(() => {
        if (methods.length > 0) {
            const splitMethods = (methods[0] ?? "").split(",");
            setSelectedMethods(splitMethods as CommunicationMethod[]);
        }
    }, [methods]);

    const handleMethodChange = (method: CommunicationMethod) => {
        let updatedSelection: string[];

        if (!selectedMethods.includes(method)) {
            updatedSelection = [...selectedMethods, method];
        } else {
            updatedSelection = selectedMethods.filter((m) => m !== method);
        }

        // remove empty strings
        updatedSelection = updatedSelection.filter((m) => m !== "");

        // remove duplicates
        updatedSelection = [...new Set(updatedSelection)];

        const updatedSelectionCommunication =
            updatedSelection as CommunicationMethod[];

        setSelectedMethods(updatedSelectionCommunication);
        setMethodMutate({
            userId: session.user.id,
            methods: updatedSelectionCommunication,
        });
    };

    const communicationMethodToIcon: Record<string, JSX.Element> = {
        SLACK: <SlackLogo />,
        EMAIL: <EmailLogo />,
        PHONE: <PhoneLogo />,
        SIGNAL: <SignalLogo />,
        TEAMS: <TeamsLogo />,
        WHATSAPP: <WhatsappLogo />,
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
                            checked={
                                selectedMethods.length > 0
                                    ? selectedMethods.includes(method)
                                    : methods.includes(method)
                            }
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
