export type McpToolScope =
  "portfolio:read" | "portfolio:draft" | "portfolio:propose";

export type McpToolCatalogItem = {
  name: string;
  title: string;
  description: string;
  scope: McpToolScope;
  directWrite?: boolean;
};

// This is deliberately client-safe. It documents the tools registered in
// `tools.ts`; execution and authorization remain server-side.
export const mcpToolCatalog: readonly McpToolCatalogItem[] = [
  {
    name: "read_portfolio_overview",
    title: "Read portfolio overview",
    description:
      "Read settings and compact summaries of all portfolio content.",
    scope: "portfolio:read",
  },
  {
    name: "read_profile_settings",
    title: "Read profile settings",
    description:
      "Read editable profile, contact, location, resume, and availability settings.",
    scope: "portfolio:read",
  },
  {
    name: "read_discoverability_status",
    title: "Read discoverability status",
    description:
      "Read the public SEO and AI-discovery endpoints exposed by the portfolio.",
    scope: "portfolio:read",
  },
  {
    name: "read_content_item",
    title: "Read content item",
    description:
      "Read one project, post, or recognition before preparing a change.",
    scope: "portfolio:read",
  },
  {
    name: "read_tech_stack",
    title: "Read tech stack",
    description: "Read every technology managed in the admin Tech Stack area.",
    scope: "portfolio:read",
  },
  {
    name: "read_experiences",
    title: "Read experiences",
    description:
      "Read the editable experience timeline, including highlights and order.",
    scope: "portfolio:read",
  },
  {
    name: "open_article_image_uploader",
    title: "Article image uploader",
    description:
      "Open a compact picker for storing an article image privately.",
    scope: "portfolio:draft",
  },
  {
    name: "prepare_experience_draft",
    title: "Prepare experience draft",
    description: "Prepare a private experience timeline entry for approval.",
    scope: "portfolio:draft",
  },
  {
    name: "prepare_tech_stack_item_draft",
    title: "Prepare Tech Stack item",
    description: "Prepare a hidden Tech Stack item for approval.",
    scope: "portfolio:draft",
  },
  {
    name: "prepare_project_draft",
    title: "Prepare project draft",
    description:
      "Prepare a private project draft; it is never published directly.",
    scope: "portfolio:draft",
  },
  {
    name: "prepare_post_draft",
    title: "Prepare writing draft",
    description: "Prepare a private Markdown writing draft for approval.",
    scope: "portfolio:draft",
  },
  {
    name: "prepare_recognition_draft",
    title: "Prepare recognition draft",
    description: "Prepare a private recognition draft for approval.",
    scope: "portfolio:draft",
  },
  {
    name: "store_article_image",
    title: "Store article image",
    description:
      "Store an article image privately and return managed Markdown.",
    scope: "portfolio:draft",
    directWrite: true,
  },
  {
    name: "approve_mcp_proposal",
    title: "Approve MCP proposal",
    description:
      "Approve or reject a proposal after the owner has reviewed it.",
    scope: "portfolio:propose",
    directWrite: true,
  },
  {
    name: "list_mcp_pending_proposals",
    title: "List pending MCP proposals",
    description: "List proposals created by this MCP connection for review.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_experience_update",
    title: "Prepare experience update",
    description:
      "Prepare an update to an existing experience entry for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_experience_delete",
    title: "Prepare experience deletion",
    description: "Prepare deletion of an experience entry for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_experience_reorder",
    title: "Prepare experience reorder",
    description: "Prepare a new experience timeline order for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_tech_stack_item_update",
    title: "Prepare Tech Stack update",
    description:
      "Prepare an update to an existing Tech Stack item for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_tech_stack_item_delete",
    title: "Prepare Tech Stack deletion",
    description: "Prepare deletion of a Tech Stack item for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_tech_stack_reorder",
    title: "Prepare Tech Stack reorder",
    description: "Prepare a Tech Stack group or order change for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_now_update",
    title: "Prepare Now update",
    description: "Prepare a change to the public Now section for approval.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_project_update",
    title: "Prepare project update",
    description: "Prepare replacement fields for an existing project.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_post_update",
    title: "Prepare writing update",
    description: "Prepare replacement fields for an existing writing post.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_recognition_update",
    title: "Prepare recognition update",
    description: "Prepare replacement fields for an existing recognition.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_placement_change",
    title: "Prepare publication or pin change",
    description:
      "Prepare publishing, unpublishing, pinning, or unpinning content.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_content_deletion",
    title: "Prepare content deletion",
    description:
      "Prepare permanent deletion of a project, post, or recognition.",
    scope: "portfolio:propose",
  },
  {
    name: "request_media_upload",
    title: "Request media upload",
    description:
      "Create a short-lived upload slot for managed media or a resume.",
    scope: "portfolio:propose",
    directWrite: true,
  },
  {
    name: "prepare_contact_update",
    title: "Prepare contact update",
    description: "Prepare changes to public email and social-profile links.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_resume_replacement",
    title: "Prepare resume replacement",
    description: "Prepare an uploaded PDF as the public resume, or remove it.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_project_icon_update",
    title: "Prepare project icon update",
    description: "Prepare a built-in or uploaded icon for an existing project.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_recognition_icon_update",
    title: "Prepare recognition icon update",
    description: "Prepare a built-in icon change for an existing recognition.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_recognition_image_update",
    title: "Prepare recognition images update",
    description:
      "Prepare the full ordered image list for an existing recognition.",
    scope: "portfolio:propose",
  },
  {
    name: "prepare_seo_update",
    title: "Prepare SEO update",
    description:
      "Prepare default SEO title and description changes for approval.",
    scope: "portfolio:propose",
  },
];
