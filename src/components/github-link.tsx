"use client";

import { GithubLogo } from "./svg";
import { Button } from "./ui/button";

const GitHubLink = () => {
    return (
        <Button
            variant="outline"
            className="ml-2"
            onClick={() =>
                window.open(
                    "https://github.com/infosupport/tech-survey/",
                    "_blank",
                )
            }
        >
            <GithubLogo />
            Contribute
        </Button>
    );
};

export default GitHubLink;
