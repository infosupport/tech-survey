import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { idToTextMap } from "~/utils/optionMapping";

export default function SkeletonDemo() {
  const answerOptions = [
    { id: 0, option: "Strongly Disagree" },
    { id: 1, option: "Disagree" },
    { id: 2, option: "Neutral" },
    { id: 3, option: "Agree" },
  ];

  // create 20 dummy questions
  const filteredQuestions = Array.from({ length: 20 }, (_, i) => ({
    id: i.toString(),
    questionText: `Question ${i + 1}`,
  }));

  return (
    <div className="container flex h-full flex-col items-center justify-center gap-12 px-4 py-16">
      <div>
        <Table>
          <TableHeader className="sticky top-0 z-10 h-10 w-full bg-slate-100 dark:bg-slate-900">
            <TableRow>
              <TableHead className="w-[200px]">Question</TableHead>
              {answerOptions.map((option) => (
                <TableHead key={option.id}>{idToTextMap[option.id]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions?.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  <Skeleton className="h-4 w-[250px]" />
                </TableCell>
                {answerOptions.map((option) => (
                  <TableCell key={option.id}>
                    <Skeleton className="h-4 w-[200px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
