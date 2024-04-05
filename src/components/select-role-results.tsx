"use client";

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
import { ScrollArea } from "~/components/ui/scroll-area";
import { type Section } from "~/models/types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { slugify } from "~/utils/slugify";
import { ArrowDown } from "./svg";

const SelectRoleResults = ({ roles }: { roles: Section[] }) => {
  const pathname = usePathname() || "";

  const currentRole = pathname.split("/").pop() ?? "";
  const currentRoleBeautified = roles.find(
    (section) => slugify(section.label) === currentRole,
  )?.label;

  // Check if the current role is in the list of roles
  const roleExists = roles.some(
    (section) => slugify(section.label) === currentRole,
  );
  if (!roleExists) {
    return;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="mt-5 flex justify-center">
          <div className="mt-5 flex flex-col items-center gap-6 md:flex-row">
            <Button className=" bg-custom-buttonPrimary text-custom-secondary hover:bg-custom-buttonHover dark:bg-custom-buttonPrimary dark:hover:bg-custom-buttonHover">
              Viewing results for role: {currentRoleBeautified} <ArrowDown />
            </Button>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Roles:</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="w-50 h-72 rounded-md border">
          {roles.map((section) => (
            <Link href={section.href} key={section.id}>
              <DropdownMenuCheckboxItem checked={section.current}>
                {section.label}
              </DropdownMenuCheckboxItem>
            </Link>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export { SelectRoleResults };
