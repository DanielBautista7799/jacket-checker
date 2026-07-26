import { Link } from "react-router";
import { Database, EyeOff, LocateFixed, ShieldCheck } from "lucide-react";

import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const EFFECTIVE_DATE = "July 26, 2026";

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-white">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-7 text-slate-300">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <section
      className="page-enter mx-auto max-w-4xl py-6 sm:py-12"
      aria-labelledby="privacy-title"
    >
      <Card className="p-5 sm:p-8">
        <Badge tone="info">
          <ShieldCheck size={13} aria-hidden="true" />
          Privacy policy
        </Badge>

        <h1
          id="privacy-title"
          className="font-display mt-5 text-3xl font-bold tracking-[-0.045em] text-white sm:text-5xl"
        >
          Your data stays focused on the recommendation.
        </h1>

        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
          Jacket Checker uses weather, profile, and private wardrobe information
          to answer whether you need a jacket and, for signed-in users, which
          jacket you already own is the best fit. This policy explains what the
          service handles and how you can control it.
        </p>

        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
          Effective {EFFECTIVE_DATE}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/12 bg-cyan-400/[0.05] p-4">
            <LocateFixed className="text-cyan-200" size={20} aria-hidden="true" />
            <p className="mt-3 font-extrabold text-white">Location on request</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Location is used only when you choose it for a weather check. The
              app does not perform background location tracking.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-300/12 bg-violet-400/[0.05] p-4">
            <Database className="text-violet-200" size={20} aria-hidden="true" />
            <p className="mt-3 font-extrabold text-white">Private account data</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Account records and wardrobe images are protected through Supabase
              authentication, Row Level Security, and private Storage.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-300/12 bg-emerald-400/[0.05] p-4">
            <EyeOff className="text-emerald-200" size={20} aria-hidden="true" />
            <p className="mt-3 font-extrabold text-white">No ad tracking</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Jacket Checker does not sell personal information, show ads, or
              track you across other companies' apps and websites.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-9">
          <Section title="Information handled by Jacket Checker">
            <p>
              Guest weather checks may use a searched place, latitude and
              longitude, selected forecast window, and a locally generated guest
              identifier. Guest mode does not require an account.
            </p>
            <p>
              Signed-in features may handle your email address, Supabase user ID,
              comfort and style profile, saved location, private jacket images,
              jacket metadata, recommendations, history, feedback, and analytics
              preference. Passwords are handled by Supabase Auth and are never
              stored in Jacket Checker application tables.
            </p>
          </Section>

          <Section title="How information is used">
            <p>
              Information is used to authenticate your account, retrieve weather,
              calculate recommendations, rank jackets you own, maintain your
              private wardrobe, improve future recommendations from explicit
              feedback, prevent abuse, diagnose failures, and provide support.
            </p>
            <p>
              Privacy-safe product analytics are used only according to the
              analytics controls available in your profile. Analytics are not
              used for advertising or cross-app tracking.
            </p>
          </Section>

          <Section title="Location">
            <p>
              You can search for a city, use a saved location, or grant foreground
              location permission. Coordinates are sent only as needed to retrieve
              the requested forecast and calculate a recommendation. Jacket Checker
              does not request continuous background location access.
            </p>
          </Section>

          <Section title="Wardrobe images and AI analysis">
            <p>
              Uploaded jacket images are stored privately. When you choose AI
              analysis, image data may be sent through a protected Supabase Edge
              Function to the configured AI provider, such as Google Gemini or
              OpenAI, to suggest jacket metadata. AI analysis is optional, and you
              can use manual entry instead.
            </p>
          </Section>

          <Section title="Service providers">
            <p>
              Jacket Checker relies on Supabase for authentication, database,
              private file storage, and Edge Functions; WeatherAPI for forecast
              information; Netlify for the public website; and configured AI
              providers only when optional jacket analysis is requested. These
              providers process information needed to deliver their services.
            </p>
          </Section>

          <Section title="Retention and deletion">
            <p>
              Account information is retained while your account remains active or
              as needed to operate and secure the service. You can delete individual
              wardrobe items and recommendation history inside the app. You can also
              permanently delete your account from Profile settings, which triggers
              the server-enforced account deletion workflow.
            </p>
          </Section>

          <Section title="Security">
            <p>
              Jacket Checker uses HTTPS, authenticated Supabase sessions, Row Level
              Security, private Storage, server-side authorization, rate limiting,
              restricted Edge Function origins, security headers, and automated
              security checks. No internet service can promise absolute security,
              but the project is designed to minimize access and exposure.
            </p>
          </Section>

          <Section title="Children and changes">
            <p>
              Jacket Checker is a general weather and wardrobe utility and is not
              directed to children under 13. This policy may be updated when the
              service changes. The effective date above identifies the current
              version.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Privacy and support questions can be sent to{" "}
              <a
                href="mailto:danielb7799@gmail.com"
                className="font-bold text-cyan-200 hover:text-cyan-100"
              >
                danielb7799@gmail.com
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-400/10 pt-6 sm:flex-row">
          <Button asChild>
            <Link to="/support">Open support</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/">Return to Jacket Checker</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}
