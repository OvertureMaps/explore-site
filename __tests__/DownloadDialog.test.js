/**
 * Tests for components/nav/DownloadDialog.jsx
 *
 * Covers: themed hierarchy rendering, bbox display, zip name, layer sizes,
 * confirm/cancel callbacks, disabled state when no types, and closed state.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DownloadDialog from "@/components/nav/DownloadDialog";

// Mock the hierarchy so tests don't depend on real explore-tree.json data.
// Each theme has items with source-layer types matching TYPES below.
jest.mock("@/lib/layerHierarchy", () => ({
  exploreHierarchy: [
    {
      key: "buildings",
      name: "Buildings",
      items: [{ type: "building", name: "Building" }],
    },
    {
      key: "places",
      name: "Places",
      items: [{ type: "place", name: "Place" }],
    },
    {
      key: "transportation",
      name: "Transportation",
      items: [{ type: "segment", name: "Segment" }],
    },
  ],
}));

// Actual overture:type values (singular) that getVisibleTypes() returns.
const TYPES = ["building", "place", "segment"];
const BBOX = [-77.69, 39.13, -77.68, 39.15];
const ZIP_NAME = "overture-2024-09-18--77.690,39.130,-77.680,39.150.zip";
const LAYER_SIZES = { building: 1024 * 1024, place: 512 * 1024, segment: 0 };

function renderDialog(props = {}) {
  const defaults = {
    open: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    visibleTypes: TYPES,
    bbox: BBOX,
    zipName: ZIP_NAME,
    layerSizes: LAYER_SIZES,
  };
  return render(<DownloadDialog {...defaults} {...props} />);
}

describe("DownloadDialog", () => {
  describe("rendering", () => {
    it("shows the dialog title", () => {
      renderDialog();
      expect(screen.getByText("Confirm Download")).toBeInTheDocument();
    });

    it("shows a theme header for each visible source-layer type", () => {
      renderDialog();
      expect(screen.getByTestId("theme-buildings")).toBeInTheDocument();
      expect(screen.getByTestId("theme-places")).toBeInTheDocument();
      expect(screen.getByTestId("theme-transportation")).toBeInTheDocument();
    });

    it("renders checked disabled checkboxes for visible items", () => {
      renderDialog();
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBeGreaterThan(0);
      checkboxes.forEach((cb) => {
        expect(cb).toBeChecked();
        expect(cb).toBeDisabled();
      });
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

    it("shows no theme headers and fallback message when visibleTypes is empty", () => {
      renderDialog({ visibleTypes: [] });
      expect(screen.getByText(/No visible layers available/i)).toBeInTheDocument();
      expect(screen.queryByTestId("theme-buildings")).not.toBeInTheDocument();
    });

    it("does not render when open is false", () => {
      renderDialog({ open: false });
      expect(screen.queryByText("Confirm Download")).not.toBeInTheDocument();
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

  describe("layer sizes", () => {
    it("shows formatted sizes at the theme level when layerSizes is populated", () => {
      renderDialog();
      expect(screen.getByTestId("size-buildings")).toHaveTextContent("1.0 MB");
      expect(screen.getByTestId("size-places")).toHaveTextContent("512.0 KB");
    });

    it("shows — for a theme with 0 bytes", () => {
      renderDialog();
      expect(screen.getByTestId("size-transportation")).toHaveTextContent("—");
    });

    it("shows per-theme spinners when layerSizes is null (not yet loaded)", () => {
      renderDialog({ layerSizes: null });
      const spinners = screen.getAllByRole("progressbar");
      expect(spinners.length).toBeGreaterThanOrEqual(TYPES.length);
    });

    it("shows spinner for a theme whose size is still null", () => {
      renderDialog({ layerSizes: { building: 1024, place: null, segment: 512 } });
      expect(screen.getByLabelText("Loading size for places")).toBeInTheDocument();
      expect(screen.getByTestId("size-buildings")).toBeInTheDocument();
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

    it("calls onCancel when the dialog backdrop is clicked (Escape / outside click)", () => {
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
