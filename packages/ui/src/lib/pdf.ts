export interface PDFExportOptions {
  filename?: string;
  marginMm?: number;
  scale?: number;
  quality?: number;
  backgroundColor?: string;
}

/**
 * Captures an HTML element and triggers a direct browser download as a high-quality PDF.
 * Uses html-to-image and jsPDF, completely bypassing CSS color-space parsing issues (lab/oklab/oklch).
 *
 * @param target The HTMLElement instance or its string DOM ID
 * @param options PDF export formatting and download options
 */
export async function downloadElementAsPDF(
  target: HTMLElement | string,
  options?: PDFExportOptions
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const element: HTMLElement | null =
    typeof target === "string" ? document.getElementById(target) : target;

  if (!element) {
    throw new Error(
      `PDF export failed: target element ${typeof target === "string" ? `with ID '${target}'` : ""} not found.`
    );
  }

  const {
    filename,
    marginMm = 10,
    scale = 2,
    backgroundColor = "#ffffff",
  } = options || {};

  // Resolve dynamic filename from option, element dataset, or timestamp fallback
  const rawFilename =
    filename?.trim() ||
    element.getAttribute("data-filename") ||
    element.getAttribute("data-title") ||
    `export-${new Date().toISOString().split("T")[0]}`;

  // Sanitize filename to remove invalid filesystem characters
  const sanitizedBase = rawFilename
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  const cleanFilename = sanitizedBase.toLowerCase().endsWith(".pdf")
    ? sanitizedBase
    : `${sanitizedBase || "document"}.pdf`;

  // Dynamically load browser-only libraries
  const [{ default: jsPDF }, { toPng }] = await Promise.all([
    import("jspdf"),
    import("html-to-image"),
  ]);

  // Capture high-resolution image using native browser rendering without scrollbars
  const imgData = await toPng(element, {
    pixelRatio: scale,
    backgroundColor,
    cacheBust: true,
    filter: (domNode) => {
      if (!domNode || !(domNode instanceof HTMLElement)) return true;
      if (
        domNode.classList.contains("print:hidden") ||
        domNode.classList.contains("pdf-hidden") ||
        domNode.getAttribute("data-pdf-ignore") === "true"
      ) {
        return false;
      }
      return true;
    },
    style: {
      overflow: "visible",
    },
  });

  // Load image dimensions to compute exact aspect ratio
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load rendered image into PDF."));
    img.src = imgData;
  });

  // Standard A4 dimensions in millimeters
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const contentWidthMm = pageWidthMm - marginMm * 2;

  // Calculate scaled image height in mm
  const imgWidthPx = img.naturalWidth || img.width;
  const imgHeightPx = img.naturalHeight || img.height;
  const contentHeightMm = (imgHeightPx * contentWidthMm) / imgWidthPx;

  // Multi-page handling if content exceeds single A4 page
  const maxPageContentHeight = pageHeightMm - marginMm * 2;
  let remainingHeightMm = contentHeightMm;
  let currentPositionMm = 0;

  if (contentHeightMm <= maxPageContentHeight) {
    // Single page document
    pdf.addImage(
      imgData,
      "PNG",
      marginMm,
      marginMm,
      contentWidthMm,
      contentHeightMm,
      undefined,
      "FAST"
    );
  } else {
    // Multi-page document
    while (remainingHeightMm > 0) {
      pdf.addImage(
        imgData,
        "PNG",
        marginMm,
        marginMm - currentPositionMm,
        contentWidthMm,
        contentHeightMm,
        undefined,
        "FAST"
      );

      remainingHeightMm -= maxPageContentHeight;
      currentPositionMm += maxPageContentHeight;

      if (remainingHeightMm > 0) {
        pdf.addPage();
      }
    }
  }

  // Trigger browser download directly to the user's system
  pdf.save(cleanFilename);
}
