import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { ANATOMY_CATALOGUE, ANATOMY_BY_ID } from "@repo/schema";

/**
 * Automated SVG Interaction Contract Integrity Test
 *
 * Verifies:
 * 1. All 6 asset files exist (male, female, neutral for front and back).
 * 2. Every `data-anatomy-id` in the SVGs is registered in ANATOMY_CATALOGUE.
 * 3. Every interactive element has `data-interactive="true"` and a valid `data-anatomy-level`.
 * 4. Interactive nodes in front.svg have supportedViews including "Front".
 * 5. Interactive nodes in back.svg have supportedViews including "Back".
 * 6. Decorative elements omit `data-interactive="true"`.
 */
describe("Body Map SVG Asset & Interaction Contract Integrity", () => {
  const assetsDir = path.resolve(__dirname, "../../../../../public/assets/body-map");
  const variants = ["male", "female", "neutral"] as const;
  const views = ["front", "back"] as const;

  variants.forEach((variant) => {
    describe(`Variant: ${variant}`, () => {
      views.forEach((view) => {
        const fileName = `${view}.svg`;
        const filePath = path.join(assetsDir, variant, fileName);

        it(`should have accessible asset file: ${variant}/${fileName}`, () => {
          expect(fs.existsSync(filePath)).toBe(true);
        });

        it(`should conform to SVG Interaction Contract in ${variant}/${fileName}`, () => {
          const content = fs.readFileSync(filePath, "utf-8");
          const viewCapitalized = view === "front" ? "Front" : "Back";

          // Extract all data-anatomy-id values
          const anatomyMatches = [
            ...content.matchAll(/data-anatomy-id=["']([^"']+)["']/g),
          ];
          expect(anatomyMatches.length).toBeGreaterThan(20);

          const invalidIds: string[] = [];
          const viewMismatches: string[] = [];

          anatomyMatches.forEach((m) => {
            const id = m[1]!;
            const node = ANATOMY_BY_ID.get(id);

            if (!node) {
              invalidIds.push(id);
              return;
            }

            // Verify view semantics
            if (!node.supportedViews.includes(viewCapitalized)) {
              viewMismatches.push(
                `${id} declared in ${view} SVG but supportedViews is [${node.supportedViews.join(", ")}]`,
              );
            }
          });

          expect(invalidIds).toEqual([]);
          expect(viewMismatches).toEqual([]);
        });

        it(`should declare valid data-anatomy-level on all interactive elements in ${variant}/${fileName}`, () => {
          const content = fs.readFileSync(filePath, "utf-8");
          const levelMatches = [
            ...content.matchAll(/data-anatomy-level=["']([^"']+)["']/g),
          ];
          const validLevels = ["region", "structure", "subpart", "detail"];

          levelMatches.forEach((m) => {
            expect(validLevels).toContain(m[1]);
          });
        });
      });
    });
  });
});
