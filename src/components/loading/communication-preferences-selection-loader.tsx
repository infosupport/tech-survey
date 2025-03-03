const CommunicationPreferencesSelectionSkeleton = () => {
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
                {Array.from({ length: 6 }).map((_, index) => (
                    <li
                        key={index}
                        className={`cursor-not-allowed rounded-lg border p-4 opacity-50 hover:bg-gray-100 hover:bg-opacity-25`}
                    >
                        <div className="flex items-center">
                            <div className="mr-2 h-5 w-5 animate-pulse rounded-full bg-gray-300"></div>
                            <div className="h-4 w-20 animate-pulse bg-gray-300"></div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CommunicationPreferencesSelectionSkeleton;
