import { useContext } from "react";
import { NetworkStatusContext } from "../context/NetworkStatusContext";

export default function useNetworkStatus() {
  const value = useContext(NetworkStatusContext);
  if (!value) throw new Error("useNetworkStatus must be used within NetworkStatusProvider.");
  return value;
}
