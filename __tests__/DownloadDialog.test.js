/**
 * Tests for components/nav/DownloadDialog.jsx
 *
 * Covers: theme-grouped type rendering (static fallback + STAC-derived),
 * bbox display, zip name, confirm/cancel callbacks, disabled state when
 * no types, and closed state.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DownloadDialog from "@/components/nav/DownloadDialog";

// Realistic source-layer type strings from the Overture schema
const TYPES = ["building", "place", "segment"];
const BBOX = [-77.69, 39.13, -77.68, 39.15];
const ZIP_NAME = "overture-2024-09-18--77.690,39.130,-77.680,39.150.zip";

// STAC-derived theme→type mapping (mirrors catalog structure)
const STAC_THEME_TYPES = [
  { theme: "base",           types: ["water", "land", "land_use", "land_cover", "infrastructure", "bathymetry"] },
  { theme: "buildings",      types: ["building", "building_part"] },
  { theme: "divisions",      types: ["division", "division_boundary", "division_area"] },
  { theme: "places",         types: ["place"] },
  { theme: "transportation", types: ["segment", "connector"] },
  { theme: "addresses",      types: ["address"] },
];

function renderDialog(props = {}) {
  const defaults = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    visibleTypes: TYPES,
    bbox: BBOX,
    zipName: ZIP_NAME,
  };
  return render(<DownloadDialog {...defaults} {...props} />);
}

describe("DownloadDialog", () => {
  describe("rendering — static fallback (no themeTypes prop)", () => {
    it("shows the dialog title", () => {
      renderDialog();
      expect(screen.getByText("Confirm Download")).toBeInTheDocument();
    });

    it("renders a theme section for each known theme in visibleTypes", () => {
      renderDialog();
      expect(screen.getByTestId("theme-buildings")).toBeInTheDocument();
      expect(screen.getByTestId("theme-places")).toBeInTheDocument();
      expect(screen.getByTestId("theme-transportation")).toBeInTheDocument();
    });

    it("renders a checked disabled checkbox per type", () => {
      renderDialog();
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(TYPES.length);
      checkboxes.forEach((cb) => {
        expect(cb).toBeChecked();
        expect(cb).toBeDisabled();
      });
    });

    it("capitalises type names (building -> Building)", () => {
      renderDialog();
      expect(screen.getByText("Building")).toBeInTheDocument();
      expect(screen.getByText("Place")).toBeInTheDocument();
      expect(screen.getByText("Segment")).toBeInTheDocument();
    });

    it("shows the bounding box", () => {
      renderDialog();
      const bboxEl = screen.getByTestId("download-dialog-bbox");
      expect(bboxEl).toHaveTextContent("W -77.6900");
      expect(bboxEl).toHaveTextContent("S 39.1300");
      expect(bboxEl).toHaveTextContent("E -77.6800");
      expect(bboxEl).toHaveTextContent("N 39.1500");
    });

    it("omits bbox section when bbox is not provided", () => {
      renderDialog({ bbox: null });
      expect(screen.queryByTestId("download-dialog-bbox")).not.toBeInTheDocument();
    });

    it("mentions layers can be removed via the layer toggler", () => {
      renderDialog();
      expect(screen.getByText(/layer toggler/i)).toBeInTheDocument();
    });

    it("shows fallback message when visibleTypes is empty", () => {
      renderDialog({ visibleTypes: [] });
      expect(screen.getByText(/No visible layers available/i)).toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Confirm Download")).not.toBeInTheDocument();
    });
  });

  describe("rendering — STAC-derived themeTypes", () => {
    it("groups types by STAC theme when themeTypes provided", () => {
      renderDialog({ themeTypes: STAC_THEME_TYPES });
      expect(screen.getByTestId("theme-buildings")).toBeInTheDocument();
      expect(screen.getByTestId("theme-places")).toBeInTheDocument();
      expect(screen.getByTestId("theme-transportation")).toBeInTheDocument();
    });

    it("only shows theme sections that have a visible type", () => {
      renderDialog({ themeTypes: STAC_THEME_TYPES });
      // "base", "divisions", "addresses" have no visible type in TYPES
      expect(screen.queryByTestId("theme-base")).not.toBeInTheDocument();
      expect(screen.queryByTestId("theme-divisions")).not.toBeInTheDocument();
      expect(screen.queryByTestId("theme-addresses")).not.toBeInTheDocument();
    });

    it("uses STAC theme order (buildings before places before transportation)", () => {
      renderDialog({ themeTypes: STAC_THEME_TYPES });
      const themeEls = screen
        .getAllByTestId(/^theme-/)
        .map((el) => el.getAttribute("data-testid"));
      expect(themeEls.indexOf("theme-buildings")).toBeLessThan(themeEls.indexOf("theme-places"));
      expect(themeEls.indexOf("theme-places")).toBeLessThan(themeEls.indexOf("theme-transportation"));
    });

    it("places unknown types under 'other' theme when using STAC data", () => {
      const unknownType = "unknown_future_type";
      renderDialog({ visibleTypes: [unknownType], themeTypes: STAC_THEME_TYPES });
      expect(screen.getByTestId("theme-other")).toBeInTheDocument();
    });
  });

  describe("zip name", () => {
    it("shows the zip filename when provided", () => {
      renderDialog();
      expect(screen.getByTestId("download-dialog-zipname")).toHaveTextContent(ZIP_NAME);
    });

    it("shows a spinner while zipName is null (loading)", () => {
      renderDialog({ zipName: null });
      expect(screen.queryByTestId("download-dialog-zipname")).not.toBeInTheDocument();
      expect(screen.getByLabelText("Loading archive name")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("calls onCancel when Cancel button is clicked", () => {
      const onCancel = jest.fn();
      renderDialog({ onCancel });
      fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onConfirm when Download button is clicked", () => {
      const onConfirm = jest.fn();
      renderDialog({ onConfirm });
      fireEvent.click(screen.getByRole("button", { name: /download/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when Escape is pressed", () => {
      const onCancel = jest.fn();
      renderDialog({ onCancel });
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("disables the Download button when visibleTypes is empty", () => {
      renderDialog({ visibleTypes: [] });
      expect(screen.getByRole("button", { name: /download/i })).toBeDisabled();
    });

    it("enables the Download button when visibleTypes is non-empty", () => {
      renderDialog();
      expect(screen.getByRole("button", { name: /download/i })).not.toBeDisabled();
    });
  });
});
