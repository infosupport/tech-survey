"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { BusinessUnit } from "~/prisma";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Role } from "~/models/types";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";

const formSchema = z.object({
    role: z.string(),
    unit: z.string(),
});

export default function SearchAnonymized({
    roles,
    businessUnits,
}: {
    roles: Role[];
    businessUnits: BusinessUnit[];
}) {
    const searchParams = useSearchParams();
    const path = usePathname();
    const route = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: searchParams.get("role") ?? "",
            unit: searchParams.get("unit") ?? "",
        },
    });

    const { role, unit } = form.watch();

    const onSubmit = useCallback(
        (values: z.infer<typeof formSchema>) => {
            const roleParam =
                values.role && values.role !== "No role"
                    ? `role=${values.role}`
                    : "";
            const unitParam =
                values.unit && values.unit !== "No unit"
                    ? `unit=${values.unit}`
                    : "";
            route.push(`${path}?${roleParam}${unitParam}`);
        },
        [route, path],
    );

    useEffect(() => {
        onSubmit({ role, unit });
    }, [onSubmit, role, unit]);

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
                                                            value={r.role}
                                                            key={r.id}
                                                        >
                                                            {r.role}
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
