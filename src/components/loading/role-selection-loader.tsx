import ButtonSkeleton from "./button-loader";

const RoleSelectionSkeleton = () => {
    return (
        <div className="container mx-auto py-8">
            <h1 className="mb-4 animate-pulse text-2xl font-bold">
                Select Roles
            </h1>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 15 }).map((_, index) => (
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
            <div className="mt-8 flex">
                <ButtonSkeleton />
            </div>
        </div>
    );
};

export default RoleSelectionSkeleton;
