import { SpinnerButton } from "./ui/button-spinner";

const SpinnerSubmitButton = ({
  isSubmitting,
  submitResponse,
  selectedRolesForProgressBar,
}) => {
  return (
    <SpinnerButton
      type="submit"
      state={isSubmitting || submitResponse.isLoading}
      disabled={submitResponse.isLoading}
      name={getNextHref(selectedRolesForProgressBar) ? "Next" : "Submit"}
    />
  );
};

export default SpinnerSubmitButton;
