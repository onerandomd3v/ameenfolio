export function rewriteManagedImageUrlsForAdminPreview(html: string) {
  return html.replace(
    /(<img\b[^>]*\bsrc=")\/media\/([^?#"]+)([?#][^"]*)?(")/g,
    (
      _match,
      before: string,
      key: string,
      suffix: string | undefined,
      after: string,
    ) => {
      const suffixText = suffix ?? "";
      return `${before}/api/admin/media-preview?key=${encodeURIComponent(key)}${
        suffixText.startsWith("?") ? `&${suffixText.slice(1)}` : suffixText
      }${after}`;
    },
  );
}
