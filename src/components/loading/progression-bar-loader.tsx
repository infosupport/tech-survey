import { Fragment } from "react";
import { type Role } from "~/models/types";

const NavigationSkeleton = ({ roles }: { roles: Role[] }) => {
  return (
    <nav className="relative mt-8 p-4" style={{ padding: "100px 40px 40px" }}>
      <div className="mt-4">
        {/* Progress bar */}
        <div
          className="flex items-center justify-between"
          style={{ width: "90%" }}
        >
          {roles.map((section, index) => (
            <Fragment key={section.id}>
              {/* Circle with clickable area */}
              <div className="relative flex items-center justify-center">
                <div
                  className={`mb-1 h-6 w-6 animate-pulse rounded-full border-2 bg-gray-300`}
                />
                <div
                  className="absolute -rotate-45 whitespace-nowrap text-xs font-semibold"
                  style={{
                    transformOrigin: "bottom left",
                    top: "-22px",
                    left: "calc(100% - 0px)",
                  }}
                >
                  <span className="block h-4 w-16 animate-pulse bg-gray-300" />
                </div>
              </div>
              {/* Line (except for the last section) */}
              {index !== roles.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 animate-pulse bg-gray-300`}
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <h3 className="hidden animate-pulse text-lg font-semibold">Progress</h3>
        <span className="animate-pulse text-sm">0.00% Completed</span>
      </div>
    </nav>
  );
};

export default NavigationSkeleton;
