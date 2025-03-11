import type { ColumnDef } from "@tanstack/react-table";
import {
    aggregateColumns,
    columns,
    type AggregatedSurveyResult,
} from "~/components/columns";
import { DataTable } from "~/components/data-tables/data-table";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "~/components/ui/accordion";
import {
    aggregatedDataByRole,
    dataByRoleAndQuestion,
} from "~/utils/privacy-utils";

const PrivacyPage = () => {
    return (
        <div className="container mx-auto py-16 sm:px-4 sm:py-16 md:px-8 lg:px-16">
            <h1 className="text-center text-5xl font-extrabold tracking-tight">
                Privacy Policy
            </h1>
            <div className="items-center justify-center  py-6">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="mb-8 text-lg ">
                            Every day we are working on solid and innovative
                            solutions that directly or indirectly touch the
                            daily lives of almost everyone. In order to provide
                            you with the best possible service, we need data.
                        </p>
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-bold ">
                                We respect your privacy and are happy to give
                                you insight into what we do with your data.
                            </h2>
                        </div>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                Why do we process personal data?{" "}
                            </AccordionTrigger>
                            <AccordionContent>
                                Collection of personal data is necessary to
                                verify the identity of employees and register
                                their technical skills within the application.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                What personal data do we process?
                            </AccordionTrigger>
                            <AccordionContent>
                                Full name, email address and self-assessed
                                technical abilities
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                How do we secure your data?
                            </AccordionTrigger>
                            <AccordionContent>
                                We take appropriate security measures to limit
                                misuse of, and unauthorized access to, your
                                personal data. We have an information security
                                policy for this purpose. For example, we ensure
                                that only the necessary persons have access to
                                your data, that access to your personal data is
                                protected and that our security measures are
                                checked regularly. In addition, we check whether
                                the security measures themselves are still in
                                line with security standards and the state of
                                the art. To ensure maximum protection of our
                                property and your personal data, we continuously
                                analyze log data and communications from our
                                systems. We use secure connections that shield
                                all information between you and our website when
                                you enter personal data. If Info Support
                                employees have access to your data, they are
                                obliged to maintain confidentiality.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                Who can access your data?
                            </AccordionTrigger>
                            <AccordionContent>
                                Access for all employees at Info Support B.V
                                (NL) and Info Support N.V. (BE):
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-5">
                            <AccordionTrigger>
                                What are your rights?
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul>
                                    <li>
                                        <strong>Inspection:</strong> if you
                                        wish, we can give you information about
                                        or possibly access the personal data we
                                        hold about you.
                                    </li>
                                    <li>
                                        <strong>Correction:</strong> if certain
                                        information is incorrect or incomplete
                                        and you cannot change it yourself, we
                                        will correct it for you.
                                    </li>
                                    <li>
                                        <strong>Deletion:</strong> you can
                                        request the deletion of your personal
                                        data.
                                    </li>
                                    <li>
                                        <strong>Objection:</strong> you can also
                                        object to or limit the processing.
                                    </li>
                                    <li>
                                        <strong>Withdraw consent:</strong> if
                                        you wish to withdraw consent previously
                                        given, you can do so as well.
                                    </li>
                                </ul>
                                <p className="mt-3">
                                    Keep in mind that you always have some
                                    rights but other rights depend on a specific
                                    situation. This means that in some cases we
                                    cannot or may not respond to your question
                                    or request. Below you will find whom you can
                                    contact for your rights.
                                </p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <h3 className="mb-5 mt-10 text-3xl font-extrabold tracking-tight">
                        Example of how your data is presented in this Tech
                        Survey
                    </h3>
                    <p>
                        In the &apos;find the expert&apos; feature, we display
                        an aggregate table sorted by how many times a person
                        indicated &apos;expert&apos; for a technique. This is to
                        help you find the right person to ask for help
                    </p>
                    {Object.keys(aggregatedDataByRole).map((role) => {
                        return (
                            <div key={role}>
                                <h3 className="mb-3 mt-3 text-lg font-semibold">
                                    Aggregated Results
                                </h3>
                                <DataTable<AggregatedSurveyResult, unknown>
                                    columns={aggregateColumns}
                                    data={Object.keys(
                                        aggregatedDataByRole[role] ?? {},
                                    ).map((question) => {
                                        const rowData =
                                            aggregatedDataByRole[role]?.[
                                                question
                                            ];
                                        return {
                                            name: rowData?.name ?? "",
                                            email: question,
                                            id: rowData?.id ?? "",
                                            communicationPreferences:
                                                rowData?.communicationPreferences ??
                                                [],
                                            "0": rowData?.counts[0] ?? 0,
                                            "1": rowData?.counts[1] ?? 0,
                                            "2": rowData?.counts[2] ?? 0,
                                            "3": rowData?.counts[3] ?? 0,
                                        };
                                    })}
                                />
                            </div>
                        );
                    })}

                    <p className="mt-5">
                        Furthermore, we list who is an expert in that technique.
                        If several participants have indicated for a technique
                        that they are an expert in that field, the order in
                        which this table is sorted along will be random.
                    </p>
                    {Object.keys(dataByRoleAndQuestion).map((role) => {
                        return Object.keys(
                            dataByRoleAndQuestion[role] ?? {},
                        ).map((question) => (
                            <div key={question}>
                                <h3 className="mb-3 mt-3 text-lg font-semibold">
                                    {question}
                                </h3>
                                <div className="mb-15">
                                    <DataTable
                                        columns={
                                            columns as ColumnDef<
                                                {
                                                    name: string;
                                                    email: string;
                                                    answer: string;
                                                },
                                                unknown
                                            >[]
                                        }
                                        data={
                                            dataByRoleAndQuestion[role]?.[
                                                question
                                            ] ?? []
                                        }
                                    />
                                    <hr className="my-10" />
                                </div>
                            </div>
                        ));
                    })}

                    <h3 className="mb-5 mt-10 text-3xl font-extrabold tracking-tight">
                        Contact
                    </h3>
                    <p>
                        For questions regarding this privacy statement, please
                        contact our data protection officer at{" "}
                        <a
                            className="underline"
                            href="mailto:FG@infosupport.com"
                        >
                            FG@infosupport.com
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPage;
