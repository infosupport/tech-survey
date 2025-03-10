import type { Role } from "~/models/types";
import { api } from "~/trpc/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "~/components/ui/use-toast";
import { ToastAction } from "~/components/ui/toast";

function SelectRoles({
    allRoles,
    userId,
    userRoles,
}: {
    allRoles: Role[];
    userId: string;
    setRoleIsLoading(value: boolean): void;
    userRoles: Role[];
}) {
    const { mutate: setRoleMutate, error: setRoleError } =
        api.users.setRolesForUser.useMutation();

    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const userSelectedRoles = useMemo(() => userRoles ?? [], [userRoles]);

    // Show a toast notification on role mutation error
    useEffect(() => {
        if (setRoleError) {
            toast({
                title: "Something went wrong!",
                description: `Unable to (de)select role(s). Please try again or refresh the page.`,
                variant: "destructive",
                action: (
                    <ToastAction
                        onClick={() => {
                            setRoleMutate({
                                userId: userId,
                                roleIds: selectedRoles,
                            });
                        }}
                        altText="Try again"
                    >
                        Try again
                    </ToastAction>
                ),
            });
        }
    }, [setRoleError, selectedRoles, userId, setRoleMutate]);

    // Initialize selected roles from userSelectedRoles prop
    useEffect(() => {
        setSelectedRoles(userSelectedRoles?.map((role) => role.id));
    }, [userSelectedRoles]);

    const handleRoleToggle = (roleId: string, isDefault: boolean) => {
        if (!isDefault && !setRoleError) {
            let updatedRoles;
            if (selectedRoles.includes(roleId)) {
                updatedRoles = selectedRoles.filter((role) => role !== roleId);
            } else {
                updatedRoles = [...selectedRoles, roleId];
            }

            setSelectedRoles(updatedRoles);

            setRoleMutate({
                userId: userId,
                roleIds: updatedRoles,
            });
        }
    };
    return (
        <>
            <h2 id="select-roles" className="mb-4 text-2xl font-bold">
                Select Roles
            </h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {allRoles.map((role) => (
                    <li
                        key={role.id}
                        className={`rounded-lg border p-4 ${
                            role.default
                                ? ""
                                : "cursor-pointer hover:bg-gray-400 hover:bg-opacity-25 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleRoleToggle(role.id, role.default)}
                    >
                        <input
                            type="checkbox"
                            className={`mr-2 ${role.default ? "" : "cursor-pointer"} accent-custom-primary`}
                            checked={
                                role.default || selectedRoles.includes(role.id)
                            }
                            onChange={() =>
                                handleRoleToggle(role.id, role.default)
                            }
                            disabled={role.default}
                        />

                        <label
                            className={role.default ? "" : "cursor-pointer"}
                            style={{ color: role.default ? "#999" : "inherit" }}
                        >
                            {role.role}
                        </label>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default SelectRoles;
