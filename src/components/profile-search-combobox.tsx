"use client";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";
import { FormControl } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { forwardRef, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UseFormSetValue } from "react-hook-form";
import type { KeyboardEvent } from "react";
import type { GetUsersData } from "~/server/db/prisma-client/user";

const ProfileSearchCombobox = forwardRef<
    HTMLInputElement,
    {
        users: GetUsersData[];
        setValue: UseFormSetValue<{ name: string }>;
    }
>(({ users, setValue, ...props }, _) => {
    const router = useRouter();
    const path = usePathname();
    const searchParams = useSearchParams();

    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("userId") ?? "",
    );
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const inputRef = useRef<HTMLInputElement>(null);

    // Close the popover when clicking outside of it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [inputRef]);

    const updateURL = (userId: string) => {
        const params = new URLSearchParams();
        if (userId) params.set("userId", userId);
        router.replace(`${path}?${params.toString()}`);
    };
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlightedIndex((prevIndex) =>
                Math.min(prevIndex + 1, filteredUsers.length - 1),
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex((prevIndex) => Math.max(prevIndex - 1, -1));
        } else if (e.key === "Enter") {
            if (highlightedIndex !== -1) {
                e.preventDefault();
                handleUserSelect(filteredUsers[highlightedIndex]!);
            } else if (open) {
                setOpen(false);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const handleUserSelect = (user: GetUsersData) => {
        setValue("name", user.name ?? "");
        setSearchTerm(user.id);
        updateURL(user.id);
        setOpen(false);
        setHighlightedIndex(-1);
    };

    const filteredUsers = users.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return (
        <Popover open={open}>
            <PopoverTrigger>
                <FormControl>
                    <div>
                        <Label>Name:</Label>
                        <Input
                            {...props}
                            autoComplete="off"
                            placeholder="Search by name"
                            ref={inputRef}
                            onFocus={() => setOpen(true)}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setValue("name", e.target.value);
                                setHighlightedIndex(-1);
                                setOpen(true);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </FormControl>
            </PopoverTrigger>
            <PopoverContent
                className="w-full rounded-md border p-0 shadow-md"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                        <div
                            key={user.id}
                            className={`p-2 hover:bg-accent ${highlightedIndex === index ? "bg-accent" : ""} relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`}
                            onClick={() => handleUserSelect(user)}
                        >
                            {user.name}
                        </div>
                    ))
                ) : (
                    <div className="p-2 text-sm text-gray-500">
                        No results found.
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
});

ProfileSearchCombobox.displayName = "ProfileSearchCombobox";

export default ProfileSearchCombobox;
