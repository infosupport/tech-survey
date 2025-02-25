"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { z } from "zod";
import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

const formSchema = z.object({
    name: z.string().trim(),
});
type FormSchema = z.infer<typeof formSchema>;

const ProfilePageSearch = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const path = usePathname();

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

        router.push(`${path}?${params.toString()}`);
    }, 250);
    useEffect(() => {
        debouncedUpdateURL(name);
    }, [name, path, router, debouncedUpdateURL]);

    function onSubmit(values: FormSchema) {
        const params = new URLSearchParams();
        if (values.name) params.set("name", values.name);

        router.push(`${path}?${params.toString()}`);
    }

    return (
        <div>
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8"
                >
                    <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-1">
                        <div className="sm:col-span-3">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <Label>Name:</Label>
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
        </div>
    );
};

export default ProfilePageSearch;
