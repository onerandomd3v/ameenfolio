import { getAdminSettings } from "@/db/queries";
import { ActiveSessions } from "@/components/admin/active-sessions";
import { BippyVisibilitySetting } from "@/components/admin/bippy-visibility-setting";
import { SettingsForm } from "@/components/admin/settings-form";
import { SystemStatus } from "@/components/admin/system-status";
import { getAdminSessions } from "@/lib/auth/sessions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ wakatime?: string }>;
}) {
  const query = await searchParams;
  const [settings, sessions] = await Promise.all([
    getAdminSettings(),
    getAdminSessions(),
  ]);
  return (
    <>
      {query.wakatime === "connected" ? (
        <p
          className="mb-4 border border-border px-3 py-2 text-sm"
          role="status"
        >
          WakaTime is connected. Your activity data is available to the
          portfolio and Bippy.
        </p>
      ) : query.wakatime === "error" ? (
        <p
          className="mb-4 border border-destructive/50 px-3 py-2 text-sm"
          role="alert"
        >
          WakaTime could not be connected. Check the OAuth app settings and
          callback URL, then try again.
        </p>
      ) : null}
      <SettingsForm settings={settings} />
      <ActiveSessions result={sessions} />
      <SystemStatus />
      {/* Showing him publicly is a site-wide switch, so it sits with the other
          site settings rather than on the page used to test him. */}
      <BippyVisibilitySetting enabled={settings.publicBippyEnabled} />
    </>
  );
}
