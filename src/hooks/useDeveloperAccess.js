import { useContext } from "react";

import { DeveloperAccessContext } from "../context/DeveloperAccessContext";

export default function useDeveloperAccess() {
  const context = useContext(DeveloperAccessContext);

  if (!context) {
    throw new Error(
      "useDeveloperAccess must be used inside a DeveloperAccessProvider.",
    );
  }

  return context;
}
