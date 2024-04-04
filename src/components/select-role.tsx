"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { type Session } from "next-auth";
import { type Role } from "~/models/types";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "./svg";
import { toast } from "./ui/use-toast";
import { ToastAction } from "./ui/toast";

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
  const {
    mutate: setRoleMutate,
    error: setRoleError,
    isLoading: setRoleIsLoading,
  } = api.survey.setRole.useMutation();
  const {
    mutate: setDefaultRoleMutate,
    isLoading: setDefaultRoleIsLoading,
    isSuccess: setDefaultRoleIsSuccess,
  } = api.survey.setDefaultRole.useMutation();

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
                userId: session.user.id,
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
  }, [setRoleError, selectedRoles, session.user.id, setRoleMutate]);

  useEffect(() => {
    setSelectedRoles(userSelectedRoles.map((role) => role.id));
  }, [userSelectedRoles]);

  const handleRoleToggle = (roleId: string, isDefault: boolean) => {
    if (!isDefault && !setRoleError) {
      const index = selectedRoles.indexOf(roleId);
      let updatedRoles;
      if (index === -1) {
        updatedRoles = [...selectedRoles, roleId];
      } else {
        updatedRoles = [...selectedRoles];
        updatedRoles.splice(index, 1);
      }

      setSelectedRoles(updatedRoles);
      setRoleMutate({
        userId: session.user.id,
        roleIds: updatedRoles,
      });
    }
  };

  const handleSetGeneralRole = () => {
    setDefaultRoleMutate({
      userId: session.user.id,
    });
  };

  // Redirect to /survey/general after the default role mutation succeeds
  useEffect(() => {
    if (setDefaultRoleIsSuccess) {
      window.location.href = "/survey/general";
    }
  }, [setDefaultRoleIsSuccess]);

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

      <div className="mt-5 flex justify-center">
        <div className="mt-5 flex flex-row items-center gap-6">
          <div className="flex">
            <Button
              onClick={handleSetGeneralRole}
              disabled={
                setDefaultRoleIsLoading ||
                setRoleIsLoading ||
                selectedRoles.length === 0 ||
                setRoleError !== null
              }
              className="flex items-center justify-center bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover"
            >
              <span className="mr-2">Go to survey</span>
              <Link href="/survey/general" passHref>
                <ArrowRight />
              </Link>
            </Button>
          </div>
          <Link href="/result/general">
            <Button className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
              Show anonymised results
              <ArrowRight />
            </Button>
          </Link>
          <Link href="/management/general">
            <Button className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
              Find the Expert
              <ArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
