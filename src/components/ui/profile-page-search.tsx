"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import type { UserData } from "~/app/profile-page/page";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover";

const formSchema = z.object({
    name: z.string().trim(),
});
type FormSchema = z.infer<typeof formSchema>;

const ProfilePageSearch = ({ allUsers }: { allUsers: UserData[] }) => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const path = usePathname();

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: searchParams.get("name") ?? "",
        },
    });

    const { setValue } = form;

    const [open, setOpen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

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

    const [searchTerm, setSearchTerm] = useState(
        searchParams.get("name") ?? "",
    );
    const [highlightedIndex, setHighlightedIndex] = useState(-1);

    const updateURL = (name: string) => {
        const params = new URLSearchParams();
        if (name) params.set("name", name);
        router.push(`${path}?${params.toString()}`);
    };

    const handleUserSelect = (userName: string) => {
        setValue("name", userName);
        setSearchTerm(userName);
        updateURL(userName);
        setOpen(false);
        setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault(); // Prevent cursor from moving in input
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
                handleUserSelect(filteredUsers[highlightedIndex]!.name ?? "");
            } else if (open) {
                setOpen(false);
            }
        } else if (e.key === "Escape") {
            setOpen(false);
            setHighlightedIndex(-1);
        }
    };

    const filteredUsers = allUsers.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                    }}
                    className="space-y-8"
                >
                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-1">
                        <div className="sm:col-span-3">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <Popover open={open}>
                                            <PopoverTrigger>
                                                <FormControl>
                                                    <>
                                                        <Label>Name:</Label>
                                                        <Input
                                                            {...field}
                                                            autoComplete="off"
                                                            placeholder="Search by name"
                                                            ref={inputRef}
                                                            onFocus={() =>
                                                                setOpen(true)
                                                            }
                                                            onChange={(e) => {
                                                                setSearchTerm(
                                                                    e.target
                                                                        .value,
                                                                );
                                                                setValue(
                                                                    "name",
                                                                    e.target
                                                                        .value,
                                                                );
                                                                setHighlightedIndex(
                                                                    -1,
                                                                );
                                                                setOpen(true);
                                                            }}
                                                            onKeyDown={
                                                                handleKeyDown
                                                            }
                                                        />
                                                    </>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-full rounded-md  border p-0 shadow-md"
                                                onOpenAutoFocus={(e) =>
                                                    e.preventDefault()
                                                }
                                            >
                                                {filteredUsers.length > 0 ? (
                                                    filteredUsers.map(
                                                        (user, index) => (
                                                            <div
                                                                key={user.id}
                                                                className={`p-2 hover:bg-accent ${highlightedIndex === index ? "bg-accent" : ""} relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50`}
                                                                onClick={() =>
                                                                    handleUserSelect(
                                                                        user.name ??
                                                                            "",
                                                                    )
                                                                }
                                                            >
                                                                {user.name}
                                                            </div>
                                                        ),
                                                    )
                                                ) : (
                                                    <div className="p-2 text-sm text-gray-500">
                                                        No results found.
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default ProfilePageSearch;
