"use client";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { type Role } from "~/models/types";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "./svg";

function useSetDefaultRole() {
  return api.survey.setDefaultRole.useMutation();
}

export default function SelectRoles({
  session,
  roles,
  userSelectedRoles,
}: {
  session: Session;
  roles: Role[];
  userSelectedRoles: Role[];
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const setRolesMutation = api.survey.setRole.useMutation();
  const setDefaultRoleMutation = useSetDefaultRole();

  useEffect(() => {
    setSelectedRoles(userSelectedRoles.map((role) => role.id));
  }, [userSelectedRoles]);

  const handleRoleToggle = (roleId: string, isDefault: boolean) => {
    if (!isDefault) {
      const index = selectedRoles.indexOf(roleId);
      let updatedRoles;
      if (index === -1) {
        updatedRoles = [...selectedRoles, roleId];
      } else {
        updatedRoles = [...selectedRoles];
        updatedRoles.splice(index, 1);
      }
      setSelectedRoles(updatedRoles);
      setRolesMutation.mutate({
        userId: session.user.id,
        roleIds: updatedRoles,
      });
    }
  };

  const handleSetGeneralRole = () => {
    setDefaultRoleMutation.mutate({
      userId: session.user.id,
    });
  };

  // Redirect to /survey/general after the default role mutation succeeds
  useEffect(() => {
    if (setDefaultRoleMutation.isSuccess) {
      window.location.href = "/survey/general";
    }
  }, [setDefaultRoleMutation.isSuccess]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-4 text-2xl font-bold">Select Roles</h1>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <li
            key={role.id}
            className={`rounded-lg border p-4 hover:bg-gray-100 hover:bg-opacity-25 ${
              role.default ? "" : "cursor-pointer"
            }`}
            onClick={() => handleRoleToggle(role.id, role.default)}
          >
            <input
              type="checkbox"
              className="mr-2 cursor-pointer accent-custom-primary"
              checked={role.default || selectedRoles.includes(role.id)}
              onChange={() => handleRoleToggle(role.id, role.default)}
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
      <div className="mt-8 flex">
        <Link href="/survey/general" passHref>
          <Button
            onClick={handleSetGeneralRole}
            className="bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
          >
            Go to survey
            <ArrowRight />
          </Button>
        </Link>
      </div>
    </div>
  );
}
