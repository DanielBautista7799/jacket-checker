import { useContext } from "react";
import { WardrobeContext } from "../context/WardrobeContext";

function useWardrobeItems() {
const context = useContext(WardrobeContext);

if (!context) {
throw new Error(
    "useWardrobeItems must be used inside a WardrobeProvider."
);
}

return context;
}

export default useWardrobeItems;