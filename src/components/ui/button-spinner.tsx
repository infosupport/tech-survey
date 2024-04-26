import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "~/components/ui/button";
import { ArrowRightDarkModeFriendly } from "../svg";

interface SpinnerButtonProps extends ButtonProps {
  state: boolean;
  name: string;
}

export const SpinnerButton = ({
  state,
  name,
  ...props
}: SpinnerButtonProps) => {
  return (
    <Button
      className="w-24 border-2 border-[#bed62f]"
      variant={"outline"}
      {...props}
    >
      {state ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <span>{name}</span>
          <ArrowRightDarkModeFriendly />
        </>
      )}
    </Button>
  );
};
