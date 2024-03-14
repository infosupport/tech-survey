import { useState, useEffect } from "react";

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => {
    // Initialize with the stored screen size or defaults
    const storedWidth = localStorage.getItem("screenWidth");
    const storedHeight = localStorage.getItem("screenHeight");
    return {
      width: storedWidth ? parseInt(storedWidth) : 1024,
      height: storedHeight ? parseInt(storedHeight) : 768,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      setScreenSize({ width: newWidth, height: newHeight });
      // Store screen size in local storage
      localStorage.setItem("screenWidth", newWidth.toString());
      localStorage.setItem("screenHeight", newHeight.toString());
    };

    // Check if window is defined before adding event listener
    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);

      // Clean up the event listener when the component unmounts
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return screenSize;
};

export default useScreenSize;
