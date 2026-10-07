import { spawnSync } from "node:child_process";

const unpatchedAdvisories = new Set(["GHSA-vfj7-8cjw-p6xm"]);
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  console.error("Run this check with npm run audit:security.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [npmCli, "audit", "--json"], {
  encoding: "utf8",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(result.stderr || "npm audit did not return valid JSON.");
  process.exit(result.status || 1);
}

if (result.status !== 0 && !report.vulnerabilities) {
  console.error(result.stderr || report.error?.summary || "npm audit failed.");
  process.exit(result.status || 1);
}

function advisoryIdsFor(name, visited = new Set()) {
  if (visited.has(name)) return new Set();
  visited.add(name);

  const vulnerability = report.vulnerabilities[name];
  if (!vulnerability) return new Set();

  const ids = new Set();
  for (const via of vulnerability.via) {
    if (typeof via === "string") {
      for (const id of advisoryIdsFor(via, visited)) ids.add(id);
      continue;
    }

    const id = via.url?.match(/GHSA-[a-z0-9-]+/i)?.[0];
    ids.add(id ?? `unidentified:${via.name ?? name}`);
  }
  return ids;
}

const blocking = Object.entries(report.vulnerabilities ?? {}).filter(
  ([name, vulnerability]) => {
    if (!["high", "critical"].includes(vulnerability.severity)) return false;
    const ids = advisoryIdsFor(name);
    return (
      ids.size === 0 || [...ids].some((id) => !unpatchedAdvisories.has(id))
    );
  },
);

if (blocking.length > 0) {
  console.error("High or critical npm audit findings remain:");
  for (const [name, vulnerability] of blocking) {
    console.error(`- ${name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

if (report.vulnerabilities?.braces) {
  console.warn(
    "npm audit reports GHSA-vfj7-8cjw-p6xm through the Next.js ESLint dependency tree. GitHub currently lists no patched braces release; this advisory is temporarily allowlisted while all other high and critical findings remain blocking.",
  );
}
