import { useState, useEffect } from "react";

const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: 1024,
    height: 768,
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
      const storedWidth = localStorage.getItem("screenWidth");
      const storedHeight = localStorage.getItem("screenHeight");

      console.log("storedWidth", storedWidth);
      console.log("storedHeight", storedHeight);

      setScreenSize({
        width: storedWidth ? parseInt(storedWidth) : window.innerWidth,
        height: storedHeight ? parseInt(storedHeight) : window.innerHeight,
      });
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
