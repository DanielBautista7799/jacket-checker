import { useContext } from "react";
import { ClosetContext } from "../context/ClosetContext";

function useClosetItems() {
const context = useContext(ClosetContext);

if (!context) {
throw new Error(
    "useClosetItems must be used inside a ClosetProvider."
);
}

return context;
}

export default useClosetItems;