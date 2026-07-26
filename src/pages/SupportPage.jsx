import { createElement } from "react";
import { Link } from "react-router";
import {
  KeyRound,
  LocateFixed,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

function SupportItem({ icon, title, children }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-slate-400/12 bg-black/10 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/12 bg-cyan-400/[0.06] text-cyan-200">
          {createElement(icon, {
            size: 19,
            "aria-hidden": true,
          })}
        </span>

        <div>
          <h2 className="font-extrabold text-white">{title}</h2>

          <div className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
            {children}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SupportPage() {
  return (
    <section
      className="page-enter mx-auto max-w-4xl py-6 sm:py-12"
      aria-labelledby="support-title"
    >
      <Card className="p-5 sm:p-8">
        <Badge tone="info">
          <Smartphone size={13} aria-hidden="true" />
          Jacket Checker support
        </Badge>

        <h1
          id="support-title"
          className="font-display mt-5 text-3xl font-bold tracking-[-0.045em] text-white sm:text-5xl"
        >
          Get back to your recommendation.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
          Most problems can be resolved by checking connectivity,
          permissions, or account recovery. The steps below apply to both
          the website and the iOS app.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SupportItem
            icon={RefreshCw}
            title="Weather or recommendation will not load"
          >
            <p>
              Confirm that the device is online, retry the request, and
              choose a specific city result. An offline banner appears when
              Jacket Checker detects a lost connection.
            </p>
          </SupportItem>

          <SupportItem
            icon={LocateFixed}
            title="Current location is unavailable"
          >
            <p>
              Open iOS Settings, select Jacket Checker, choose Location, and
              allow access While Using the App. You can always search for a
              city instead.
            </p>
          </SupportItem>

          <SupportItem
            icon={KeyRound}
            title="Password or sign-in help"
          >
            <p>
              Open the sign-in screen and use Forgot password. Recovery
              links are private, short-lived, and can be used only once.
              Request a new link when an older one has expired.
            </p>
          </SupportItem>

          <SupportItem
            icon={ShieldCheck}
            title="Delete your account or data"
          >
            <p>
              Signed-in users can delete wardrobe items and history
              directly. Permanent account deletion is available in Profile
              settings and uses the authenticated server deletion workflow.
            </p>
          </SupportItem>
        </div>

        <div className="mt-8 rounded-[var(--radius-card)] border border-violet-300/14 bg-violet-400/[0.055] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Mail
              className="mt-0.5 text-violet-200"
              size={21}
              aria-hidden="true"
            />

            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Contact support
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Include the device model, iOS version, what you were trying
                to do, and the exact safe error message shown in the app.
                Never send a password, access token, recovery link, or
                service key.
              </p>

              <a
                href="mailto:danielb7799@gmail.com?subject=Jacket%20Checker%20Support"
                className="mt-4 inline-flex min-h-11 items-center rounded-xl font-extrabold text-cyan-200 hover:text-cyan-100"
              >
                danielb7799@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-400/10 pt-6 sm:flex-row">
          <Button asChild>
            <Link to="/">Return to Jacket Checker</Link>
          </Button>

          <Button asChild variant="secondary">
            <Link to="/privacy">Read privacy policy</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}