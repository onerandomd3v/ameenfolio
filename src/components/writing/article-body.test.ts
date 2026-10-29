import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  ArticleBody,
  watchArticleImages,
} from "@/components/writing/article-body";
import { rewriteManagedImageUrlsForAdminPreview } from "@/lib/writing/admin-preview";
import { renderMarkdown } from "@/lib/writing/markdown";

describe("ArticleBody image loading", () => {
  it("renders managed draft images in the admin preview and reveals them when loaded", async () => {
    const key =
      "posts/2026/b7f092b0d3a494fedae8545eb4cb554fcb6cc23879d4279e.png";
    const { html: rendered } = await renderMarkdown(
      `Text before\n\n![Diagram](/media/${key})\n\nText after`,
    );
    const html = rewriteManagedImageUrlsForAdminPreview(rendered);
    const markup = renderToStaticMarkup(
      createElement(ArticleBody, {
        html,
        className: "post-body min-h-[24rem]",
      }),
    );

    expect(markup).toContain('class="post-body min-h-[24rem]"');
    expect(markup).toContain(
      `src="/api/admin/media-preview?key=${encodeURIComponent(key)}"`,
    );
    expect(markup.indexOf("Text before")).toBeLessThan(markup.indexOf("<img"));
    expect(markup.indexOf("<img")).toBeLessThan(markup.indexOf("Text after"));

    let onLoad: (() => void) | undefined;
    const classList = { add: vi.fn() };
    const image = {
      complete: false,
      classList,
      addEventListener: vi.fn((_event: string, handler: () => void) => {
        onLoad = handler;
      }),
      removeEventListener: vi.fn(),
    } as unknown as HTMLImageElement;

    const cleanup = watchArticleImages([image]);
    expect(classList.add).not.toHaveBeenCalled();
    onLoad?.();
    expect(classList.add).toHaveBeenCalledWith("is-loaded");
    cleanup();
    expect(image.removeEventListener).toHaveBeenCalledWith(
      "load",
      expect.any(Function),
    );
  });

  it("reveals an image that finished loading before the effect ran", () => {
    const classList = { add: vi.fn() };
    const image = {
      complete: true,
      classList,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as HTMLImageElement;

    watchArticleImages([image]);

    expect(classList.add).toHaveBeenCalledWith("is-loaded");
    expect(image.addEventListener).not.toHaveBeenCalled();
  });
});
