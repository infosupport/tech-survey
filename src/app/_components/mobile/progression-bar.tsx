import * as React from "react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { type Section } from "~/models/types";
import Link from "next/link";
import { CheckIcon } from "@radix-ui/react-icons";

const MobileProgressionBar = ({ roles }: { roles: Section[] }) => {
  const currentRole = roles.find((role) => role.current)?.label;
  const totalroles = roles.length;
  const completedroles = roles.filter((section) => section.completed).length;
  const progressPercentage = (completedroles / totalroles) * 100;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {currentRole ? `${currentRole} - ` : ""} {completedroles}/{totalroles}{" "}
          {progressPercentage.toFixed(2)}% Completed
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Roles:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((section) => (
          <Link href={section.href} key={section.id}>
            <DropdownMenuCheckboxItem checked={section.current}>
              {section.completed && (
                <div className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                </div>
              )}
              {section.label}
            </DropdownMenuCheckboxItem>
          </Link>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { MobileProgressionBar };
