import { useCallback, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import clearClientCaches from "../utils/clearClientCaches";

async function readFunctionError(error) {
  const response = error?.context;
  if (response instanceof Response) {
    try {
      const payload = await response.clone().json();
      return payload?.error?.message || payload?.error || payload?.message || error.message;
    } catch {
      return error?.message || "Account deletion failed.";
    }
  }
  return error?.message || "Account deletion failed.";
}

export default function useAccountDeletion() {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const deleteAccount = useCallback(async (confirmation) => {
    setDeleting(true);
    setDeleteError("");
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        body: { confirmation },
      });
      if (error) throw new Error(await readFunctionError(error));
      if (!data?.success) throw new Error(data?.error?.message || data?.error || "Account deletion failed.");
      clearClientCaches();
      await supabase.auth.signOut({ scope: "local" });
      return true;
    } catch (error) {
      setDeleteError(error.message || "Account deletion failed.");
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  return { deleteAccount, deleting, deleteError, clearDeleteError: () => setDeleteError("") };
}
