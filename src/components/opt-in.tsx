"use client";

import type { Session } from "next-auth";
import { api } from "~/trpc/react";
import { useState } from "react";

export default function OptIn({ session }: { session: Session }) {
  const { mutate: setOptInMutate } = api.survey.setOptIn.useMutation();
  const [optIn, setOptIn] = useState(session.user.findExpertOptIn);
  const handleOptInToggle = () => {
    setOptInMutate({
      userId: session.user.id,
    });
    setOptIn(!optIn);
  };

  return (
    <div className="mt-8">
      <h2 id="select-roles" className="mb-4 text-2xl font-bold">
        Appear anonymous?
      </h2>
      If you appear anonymous, colleagues will not be able to find you based on
      your expertise. So if you want to be helpful, please select
      &quot;no&quot;. Your answers will always be stored together with your
      account info.
      <ul className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <li
          className={`cursor-pointer rounded-lg border  p-4`}
          onClick={() => handleOptInToggle()}
        >
          <input

            type="radio"
            className={`mr-2 cursor-pointer `}

            checked={!optIn}
            onChange={() => handleOptInToggle()}
          />
          <label className={"cursor-pointer"}>Yes</label>
        </li>
        <li
          className={`cursor-pointer rounded-lg border p-4`}
          onClick={() => handleOptInToggle()}
        >
          <input

            type="radio"
            className={`mr-2 cursor-pointer `}

            checked={optIn}
            onChange={() => handleOptInToggle()}
          />
          <label className={"cursor-pointer"}>No</label>
        </li>
      </ul>
    </div>
  );
}
