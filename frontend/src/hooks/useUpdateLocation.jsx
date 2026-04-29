import { useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // We only proceed if the user is logged in.
    if (!userData) {
      return;
    }

    const updateLocationOnServer = (position) => {
      const { latitude, longitude } = position.coords;
      axios
        .post(
          `${serverUrl}/api/user/update-location`,
          { latitude, longitude },
          { withCredentials: true },
        )
        .catch((error) => {
          console.error("Failed to update location on server:", error);
          // Optionally, show a toast notification for server errors.
        });
    };

    const handlePermissionDenied = () => {
      console.warn(
        "Location access is blocked. To enable it, please go to your browser settings.",
      );
    };

    const handleLocationError = (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        handlePermissionDenied();
      } else {
        console.error("Geolocation error:", error.message);
      }
    };

    if ("geolocation" in navigator) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          const checkPermission = () => {
            switch (permissionStatus.state) {
              case "granted":
                // Permission is granted, get the location.
                navigator.geolocation.getCurrentPosition(
                  updateLocationOnServer,
                  handleLocationError,
                );
                break;
              case "prompt":
                // Prompt the user for permission.
                navigator.geolocation.getCurrentPosition(
                  updateLocationOnServer,
                  handleLocationError,
                );
                break;
              case "denied":
                // Permission is denied.
                handlePermissionDenied();
                break;
            }
          };

          // Check permission status initially
          checkPermission();

          // And listen for any changes
          permissionStatus.onchange = checkPermission;
        });
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [userData]);
};

export default useUpdateLocation;
