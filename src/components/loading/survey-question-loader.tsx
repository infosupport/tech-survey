import { Skeleton } from "~/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table";
import NavigationSkeleton from "./progression-bar-loader";

export default function SurveyQuestionLoader() {
    const answerOptions = [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];

    // create 6 roles of type Role[]
    const roles = Array.from({ length: 6 }, (_, index) => ({
        id: index.toString(),
        role: `Role ${index}`,
        default: index === 0,
    }));

    return (
        <div>
            <NavigationSkeleton roles={roles} />
            <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
                <div>
                    <Table>
                        <TableHeader className="sticky top-0 z-10 h-10 w-full bg-slate-100 dark:bg-slate-900">
                            <TableRow>
                                <TableHead className="w-[400px]">
                                    <Skeleton className="h-4 w-full" />
                                </TableHead>
                                {answerOptions.map((option) => (
                                    <TableHead key={option.id}>
                                        <Skeleton className="h-4 w-full" />
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 20 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[250px]" />
                                    </TableCell>
                                    {answerOptions.map((option) => (
                                        <TableCell
                                            className="h-[40px]"
                                            key={option.id}
                                        >
                                            <Skeleton className="h-4 w-[300px] " />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
