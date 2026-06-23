import { useContext } from "react";
import { StyleTrendContext } from "../context/StyleTrendContext.jsx";

export default function useStyleTrends() {
  const context = useContext(StyleTrendContext);

  if (!context) {
    throw new Error("useStyleTrends must be used inside a StyleTrendProvider.");
  }

  return context;
}
