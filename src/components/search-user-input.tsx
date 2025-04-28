"use client";
import { Input } from "~/components/ui/input";
import React, { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { useDebouncedCallback } from "use-debounce";

const formSchema = z.object({
    name: z.string(),
});

type FormSchema = z.infer<typeof formSchema>;

const SearchInput = () => {
    const path = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: searchParams.get("name") ?? "",
        },
    });

    const { name } = form.watch();

    const debouncedUpdateURL = useDebouncedCallback((name: string) => {
        const params = new URLSearchParams();
        if (name) params.set("name", name);

        router.replace(`${path}?${params.toString()}`);
    }, 250);

    useEffect(() => {
        debouncedUpdateURL(name);
    }, [name, path, router, debouncedUpdateURL]);
    const onSubmit = (data: FormSchema) => {
        const params = new URLSearchParams();
        if (data.name) params.set("name", data.name);

        router.replace(`${path}?${params.toString()}`);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-1">
                    <div className="sm:col-span-full">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            placeholder="Search by name"
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </form>
        </Form>
    );
};

export default SearchInput;
