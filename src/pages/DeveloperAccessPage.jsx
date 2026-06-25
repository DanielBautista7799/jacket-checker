import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Copy,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";

import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import Input from "../components/ui/Input";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";
import useAuth from "../hooks/useAuth";
import useDeveloperAccess from "../hooks/useDeveloperAccess";
import { supabase } from "../lib/supabaseClient";

const EMPTY_DATA = {
  access: null,
  roster: [],
  audit: [],
};

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function actionLabel(action) {
  const labels = {
    bootstrap_owner: "Owner initialized",
    grant: "Access granted",
    reactivate: "Access reactivated",
    revoke: "Access revoked",
  };
  return labels[action] || action;
}

function actionTone(action) {
  if (action === "revoke") return "error";
  if (action === "bootstrap_owner") return "purple";
  return "success";
}

function getFunctionErrorMessage(error, fallback) {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

function AccessAccountCard({ account, canManage, currentUserId, onRevoke }) {
  const isCurrentUser = account.userId === currentUserId;
  return (
    <Card className="p-4 sm:p-5" elevated={account.active} soft={!account.active}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-black text-white">
              {account.email}
            </h3>
            <Badge tone={account.role === "owner" ? "purple" : "info"}>
              {account.role === "owner" ? "Owner" : "Admin"}
            </Badge>
            <Badge tone={account.active ? "success" : "error"}>
              {account.active ? "Active" : "Revoked"}
            </Badge>
            {isCurrentUser && <Badge tone="neutral">You</Badge>}
          </div>

          <p className="mt-2 break-all font-mono text-[0.72rem] text-slate-500">
            {account.userId}
          </p>

          {account.emailChanged && (
            <p className="mt-2 text-xs text-amber-200">
              Current Auth email differs from the stored grant snapshot: {account.emailSnapshot}
            </p>
          )}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Granted
              </dt>
              <dd className="mt-1 text-slate-300">{formatDate(account.grantedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Granted by
              </dt>
              <dd className="mt-1 truncate text-slate-300">
                {account.grantedByEmail || "System bootstrap"}
              </dd>
            </div>
            {!account.active && (
              <>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    Revoked
                  </dt>
                  <dd className="mt-1 text-slate-300">{formatDate(account.revokedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
                    Revoked by
                  </dt>
                  <dd className="mt-1 truncate text-slate-300">
                    {account.revokedByEmail || "—"}
                  </dd>
                </div>
              </>
            )}
          </dl>

          {account.notes && (
            <p className="mt-4 rounded-xl border border-slate-400/12 bg-white/[0.035] px-3 py-2 text-sm leading-6 text-slate-300">
              {account.notes}
            </p>
          )}
        </div>

        {canManage && account.active && account.role !== "owner" && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => onRevoke(account)}
            className="shrink-0"
          >
            <UserRoundX size={17} aria-hidden="true" />
            Revoke
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function DeveloperAccessPage() {
  const { user, session } = useAuth();
  const {
    developerRole,
    developerNeedsBootstrap,
    canManageDeveloperAccess,
    refreshDeveloperAccess,
  } = useDeveloperAccess();
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [revokeTarget, setRevokeTarget] = useState(null);

  const invokeAccessAction = useCallback(
    async (action, payload = {}) => {
      const accessToken = session?.access_token || "";
      const { data: response, error: functionError } = await supabase.functions.invoke(
        "manage-developer-access",
        {
          body: { action, payload },
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
        },
      );

      if (functionError) {
        throw new Error(
          getFunctionErrorMessage(
            functionError,
            "Developer access could not be updated.",
          ),
        );
      }
      if (response?.error?.message) throw new Error(response.error.message);
      return response || EMPTY_DATA;
    },
    [session?.access_token],
  );

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await invokeAccessAction("list");
      setData({
        access: response.access || null,
        roster: Array.isArray(response.roster) ? response.roster : [],
        audit: Array.isArray(response.audit) ? response.audit : [],
      });
    } catch (loadError) {
      setError(
        loadError.message || "The developer access registry could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [invokeAccessAction]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadAccess();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadAccess]);

  const handleBootstrap = async () => {
    setBusyAction("bootstrap");
    setError("");
    setSuccess("");
    try {
      const response = await invokeAccessAction("bootstrap");
      setData({
        access: response.access || null,
        roster: response.roster || [],
        audit: response.audit || [],
      });
      await refreshDeveloperAccess();
      setSuccess(
        "The database registry is now the source of truth. Remove the legacy developer allowlist secrets after confirming this page still loads.",
      );
    } catch (bootstrapError) {
      setError(bootstrapError.message || "Owner setup could not be completed.");
    } finally {
      setBusyAction("");
    }
  };

  const handleGrant = async (event) => {
    event.preventDefault();
    setBusyAction("grant");
    setError("");
    setSuccess("");
    try {
      const response = await invokeAccessAction("grant", { email, notes });
      setData({
        access: response.access || null,
        roster: response.roster || [],
        audit: response.audit || [],
      });
      setSuccess(`Developer access was granted to ${email.trim().toLowerCase()}.`);
      setEmail("");
      setNotes("");
    } catch (grantError) {
      setError(grantError.message || "Developer access could not be granted.");
    } finally {
      setBusyAction("");
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setBusyAction("revoke");
    setError("");
    setSuccess("");
    try {
      const response = await invokeAccessAction("revoke", {
        targetUserId: revokeTarget.userId,
        notes: `Revoked from the Developer Access page by ${user?.email || "owner"}.`,
      });
      setData({
        access: response.access || null,
        roster: response.roster || [],
        audit: response.audit || [],
      });
      setSuccess(`Developer access was revoked for ${revokeTarget.email}.`);
      setRevokeTarget(null);
    } catch (revokeError) {
      setError(revokeError.message || "Developer access could not be revoked.");
    } finally {
      setBusyAction("");
    }
  };

  const copyUserId = async (userId) => {
    try {
      await navigator.clipboard.writeText(userId);
      setSuccess("User UUID copied.");
    } catch {
      setError("The user UUID could not be copied.");
    }
  };

  const activeAccounts = useMemo(
    () => data.roster.filter((account) => account.active),
    [data.roster],
  );
  const revokedAccounts = useMemo(
    () => data.roster.filter((account) => !account.active),
    [data.roster],
  );

  return (
    <section className="page-enter space-y-6" aria-labelledby="developer-access-title">
      <PageHeader
        eyebrow="Developer security"
        title="Developer access"
        description="See exactly which Supabase accounts can open the developer tools, grant access to existing users, revoke it immediately, and review the append-only audit history."
        actions={
          <Button
            type="button"
            variant="secondary"
            onClick={loadAccess}
            loading={loading}
          >
            <RefreshCw size={17} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4" soft>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Active accounts
          </p>
          <p className="mt-2 text-3xl font-black text-white">{activeAccounts.length}</p>
        </Card>
        <Card className="p-4" soft>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Your role
          </p>
          <p className="mt-2 text-3xl font-black capitalize text-white">
            {developerRole || data.access?.role || "Admin"}
          </p>
        </Card>
        <Card className="p-4" soft>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Audit entries
          </p>
          <p className="mt-2 text-3xl font-black text-white">{data.audit.length}</p>
        </Card>
      </div>

      {error && (
        <Alert tone="error" title="Developer access error" role="alert">
          {error}
        </Alert>
      )}
      {success && (
        <Alert tone="success" title="Developer access updated">
          {success}
        </Alert>
      )}

      {developerNeedsBootstrap && (
        <Card className="border-amber-300/20 p-5 sm:p-6" elevated>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
                <ShieldAlert size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white">
                  Secure the first owner account
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Your current email secret is temporarily allowing this setup page because the registry is empty. Initialize your signed-in account as the protected owner. Afterward, the database registry becomes the only active authorization source.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleBootstrap}
              loading={busyAction === "bootstrap"}
              className="shrink-0"
            >
              <ShieldCheck size={18} aria-hidden="true" />
              Initialize owner registry
            </Button>
          </div>
        </Card>
      )}

      {!developerNeedsBootstrap && canManageDeveloperAccess && (
        <Card className="p-5 sm:p-6" elevated>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/18 bg-cyan-400/[0.08] text-cyan-100">
              <UserPlus size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white">Grant developer access</h2>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                The email must already belong to a user in Supabase Authentication. New grants receive the Admin role and cannot grant or revoke other accounts.
              </p>
            </div>
          </div>

          <form onSubmit={handleGrant} className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
            <label className="block text-sm font-extrabold text-slate-200">
              Existing Auth email
              <Input
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="approved-user@example.com"
                className="mt-2 w-full"
              />
            </label>
            <label className="block text-sm font-extrabold text-slate-200">
              Audit note
              <Input
                type="text"
                maxLength={500}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Reason for access"
                className="mt-2 w-full"
              />
            </label>
            <Button
              type="submit"
              loading={busyAction === "grant"}
              disabled={!email.trim()}
              className="w-full lg:w-auto"
            >
              <UserRoundCheck size={18} aria-hidden="true" />
              Grant access
            </Button>
          </form>
        </Card>
      )}

      {!developerNeedsBootstrap && !canManageDeveloperAccess && (
        <Alert tone="info" title="Read-only administrator">
          You can audit the roster and access history. Only the Owner account can grant or revoke developer access.
        </Alert>
      )}

      <section aria-labelledby="active-developers-title" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-300/80">
              Current authorization
            </p>
            <h2 id="active-developers-title" className="mt-1 text-2xl font-black text-white">
              Active developer accounts
            </h2>
          </div>
          <Badge tone="success">{activeAccounts.length} active</Badge>
        </div>

        {loading ? (
          <LoadingState label="Loading developer accounts" rows={3} />
        ) : activeAccounts.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {activeAccounts.map((account) => (
              <AccessAccountCard
                key={account.userId}
                account={account}
                canManage={canManageDeveloperAccess}
                currentUserId={user?.id}
                onRevoke={setRevokeTarget}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No registry accounts yet"
            description="Initialize the owner registry to replace the temporary secret allowlist."
          />
        )}
      </section>

      {revokedAccounts.length > 0 && (
        <section aria-labelledby="revoked-developers-title" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-rose-300/80">
                Historical accounts
              </p>
              <h2 id="revoked-developers-title" className="mt-1 text-2xl font-black text-white">
                Revoked access
              </h2>
            </div>
            <Badge tone="error">{revokedAccounts.length} revoked</Badge>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {revokedAccounts.map((account) => (
              <AccessAccountCard
                key={account.userId}
                account={account}
                canManage={false}
                currentUserId={user?.id}
                onRevoke={() => {}}
              />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="developer-audit-title" className="space-y-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-300/80">
            Immutable history
          </p>
          <h2 id="developer-audit-title" className="mt-1 text-2xl font-black text-white">
            Access audit log
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            The latest 100 grant, reactivation, revocation, and owner-bootstrap events are shown. Audit rows are append-only and cannot be edited from the application.
          </p>
        </div>

        {loading ? (
          <LoadingState label="Loading access audit" rows={4} />
        ) : data.audit.length ? (
          <Card className="overflow-hidden" soft>
            <div className="divide-y divide-slate-400/10">
              {data.audit.map((entry) => (
                <article key={entry.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={actionTone(entry.action)}>
                          {entry.action === "revoke" ? (
                            <UserRoundX size={13} aria-hidden="true" />
                          ) : (
                            <CheckCircle2 size={13} aria-hidden="true" />
                          )}
                          {actionLabel(entry.action)}
                        </Badge>
                        <span className="truncate text-sm font-black text-white">
                          {entry.targetEmail}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">
                        By {entry.actorEmail || "system"}
                        {entry.previousRole || entry.newRole
                          ? ` · ${entry.previousRole || "none"} → ${entry.newRole || "none"}`
                          : ""}
                      </p>
                      {entry.notes && (
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                      <Clock3 size={14} aria-hidden="true" />
                      {formatDate(entry.createdAt)}
                    </div>
                  </div>
                  {entry.targetUserId && (
                    <button
                      type="button"
                      onClick={() => copyUserId(entry.targetUserId)}
                      className="mt-3 inline-flex items-center gap-2 rounded-lg text-xs font-bold text-slate-500 transition hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/20"
                    >
                      <Copy size={13} aria-hidden="true" />
                      Copy target UUID
                    </button>
                  )}
                </article>
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No audit entries yet"
            description="The first owner initialization will create the first permanent access event."
          />
        )}
      </section>

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke developer access?"
        description={
          revokeTarget
            ? `${revokeTarget.email} will immediately lose access to Scoring, Trends, Analytics, and this access registry.`
            : ""
        }
        confirmLabel="Revoke access"
        destructive
        loading={busyAction === "revoke"}
      >
        <Alert tone="warning" title="This is immediate">
          The account remains in the registry as Revoked so the security history is preserved. The Owner account cannot revoke itself.
        </Alert>
      </ConfirmDialog>
    </section>
  );
}
