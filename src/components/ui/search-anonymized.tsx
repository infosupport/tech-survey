"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BusinessUnit } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Section } from "~/models/types";
import { Form, FormControl, FormField, FormItem } from "./form";
import { Label } from "./label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./select";

const formSchema = z.object({
    role: z.string(),
    unit: z.string(),
});

export default function SearchAnonymized({
    roles,
    businessUnits,
}: {
    roles: Section[];
    businessUnits: BusinessUnit[];
}) {
    const searchParams = useSearchParams();
    const path = usePathname();
    const route = useRouter();
    let previousRole = "";
    let previousUnit = "";

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: searchParams.get("role") ?? "",
            unit: searchParams.get("unit") ?? "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const role2 =
            values.role != undefined
                ? values.role.length != 0 && values.role != "No role"
                    ? `role=${values.role}`
                    : ""
                : "";
        const unit2 =
            values.unit != undefined
                ? values.unit.length != 0 && values.unit != "No unit"
                    ? `&unit=${values.unit}`
                    : ""
                : "";
        route.push(`${path}?${role2}${unit2}`);
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentRole = form.getValues().role;
            const currentUnit = form.getValues().unit;
            if (previousRole != currentRole || previousUnit != currentUnit) {
                previousRole = currentRole;
                previousUnit = currentUnit;
                onSubmit({ role: currentRole, unit: currentUnit });
            }
        }, 1000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Viewing results for Unit:</Label>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue placeholder="Select a unit" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {businessUnits.map((u) => {
                                                    return (
                                                        <SelectItem
                                                            value={u.unit}
                                                            key={u.id}
                                                        >
                                                            {u.unit}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Viewing results for role:</Label>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue
                                                        placeholder="Select a role"
                                                        data-testid="selectedRole"
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {roles.map((r) => {
                                                    return (
                                                        <SelectItem
                                                            value={r.label}
                                                            key={r.id}
                                                        >
                                                            {r.label}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}
