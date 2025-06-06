"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem } from "~/components/ui/form";
import { z } from "zod";

import ProfileSearchCombobox from "~/components/profile-search-combobox";
import type { GetUsersData } from "~/server/db/prisma-client/user";

const formSchema = z.object({
    name: z.string().trim(),
});
type FormSchema = z.infer<typeof formSchema>;

const ProfilePageSearch = ({ users }: { users: GetUsersData[] }) => {
    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    });
    const { setValue } = form;

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
                                        <ProfileSearchCombobox
                                            {...field}
                                            users={users}
                                            setValue={setValue}
                                        />
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
