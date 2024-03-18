"use client";

import MobileShowResults from "./mobile/show-results";
import ShowResults from "./show-results";
import useScreenSize from "./useScreenSize";

type TransformedData = Record<string, Record<string, Record<string, number>>>;

export default function ResultsWrapper({ data }: { data: TransformedData }) {
  const screenSize = useScreenSize();
  return (
    <div>
      {screenSize.width < 768 && (
        <div>
          <MobileShowResults data={data} />
        </div>
      )}
      {screenSize.width >= 768 && (
        <div>
          <ShowResults data={data} />
        </div>
      )}
    </div>
  );
}
