
import { useEffect, useState } from "react";

const useBrowserInfo = () => {
  const [browserInfo, setBrowserInfo] = useState({
    deviceType: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userAgent = navigator.userAgent;
      let deviceType = "Desktop";

      if (/Mobi|Android/i.test(userAgent)) {
        deviceType = "Mobile";
      }

      setBrowserInfo({ deviceType });
    }
  }, []);

  return browserInfo;
};

export default useBrowserInfo;