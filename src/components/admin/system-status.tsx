import "server-only";

import {
  Activity,
  Cable,
  Cloud,
  Database,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import {
  ListRow,
  RowMeta,
  SectionHeading,
} from "@/components/admin/admin-primitives";
import { BippyIcon } from "@/components/bippy/bippy-icon";
import { OpenAIIcon } from "@/components/icons/brand-icons";
import { Badge } from "@/components/ui/badge";
import { getServerEnv } from "@/lib/env";
import { isWakaTimeConnected } from "@/lib/wakatime/oauth";

export async function SystemStatus() {
  const env = getServerEnv();
  const wakaTimeConfigured = Boolean(
    env.WAKATIME_CLIENT_ID &&
    env.WAKATIME_CLIENT_SECRET &&
    env.WAKATIME_OAUTH_REDIRECT_URI &&
    env.WAKATIME_TOKEN_ENCRYPTION_KEY,
  );
  const wakaTimeConnected = wakaTimeConfigured
    ? await isWakaTimeConnected()
    : false;
  const statuses = [
    {
      label: "Database",
      description: "Portfolio content and assistant history",
      ready: Boolean(env.DATABASE_URL),
      optional: false,
      icon: Database,
    },
    {
      label: "Authentication",
      description: "Protected administrator access",
      ready: Boolean(env.NEON_AUTH_BASE_URL && env.NEON_AUTH_COOKIE_SECRET),
      optional: false,
      icon: LockKeyhole,
    },
    {
      label: "Media storage",
      description: "Project images, profile photo, and résumé",
      ready: Boolean(
        env.R2_ACCOUNT_ID &&
        env.R2_ACCESS_KEY_ID &&
        env.R2_SECRET_ACCESS_KEY &&
        env.R2_BUCKET_NAME,
      ),
      optional: false,
      icon: Cloud,
    },
    {
      label: "OpenAI",
      description: "Portfolio assistant conversations and actions",
      ready: Boolean(env.OPENAI_API_KEY),
      optional: false,
      icon: OpenAIIcon,
    },
    {
      label: "Bippy connections",
      description: "Encrypted credentials for Bippy's external MCP tools",
      ready: Boolean(env.BIPPY_MCP_ENCRYPTION_KEY),
      optional: false,
      icon: Cable,
    },
    {
      label: "Bippy MCP",
      description: "Private ChatGPT, Claude, and Codex connections",
      ready: Boolean(
        env.MCP_ENABLED &&
        env.MCP_RESOURCE_URL &&
        env.MCP_AUTH_ISSUER &&
        env.MCP_AUTHORIZATION_URL,
      ),
      optional: true,
      icon: BippyIcon,
    },
    {
      label: "MCP cleanup",
      description: "Scheduled removal of expired OAuth credentials",
      ready: Boolean(env.MCP_MAINTENANCE_SECRET),
      optional: true,
      icon: RefreshCw,
    },
    {
      label: "WakaTime",
      description: "OAuth access for public activity and Bippy's summaries",
      ready: wakaTimeConnected,
      optional: true,
      icon: Activity,
      actions: wakaTimeConfigured ? (
        <Link
          href="/api/admin/wakatime/oauth/start"
          className="text-xs text-primary underline-offset-4 hover:underline"
        >
          {wakaTimeConnected ? "Reconnect" : "Connect WakaTime"}
        </Link>
      ) : null,
    },
  ];

  return (
    <section className="mt-8 max-w-[720px]" aria-label="System status">
      <SectionHeading meta="Server configuration">System status</SectionHeading>
      {statuses.map((status) => {
        const Icon = status.icon;
        return (
          <ListRow
            key={status.label}
            icon={<Icon aria-hidden="true" />}
            title={status.label}
            meta={<RowMeta>{status.description}</RowMeta>}
            badge={
              <Badge variant={status.ready ? "outline" : "secondary"}>
                {status.ready
                  ? "Configured"
                  : status.optional
                    ? "Optional"
                    : "Needs setup"}
              </Badge>
            }
            actions={"actions" in status ? status.actions : undefined}
          />
        );
      })}
    </section>
  );
}
