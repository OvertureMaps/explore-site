/**
 * Tests for components/nav/DownloadDialog.jsx
 *
 * Covers: type list rendering, bbox display, zip name,
 * confirm/cancel callbacks, disabled state when no types, and closed state.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import DownloadDialog from "@/components/nav/DownloadDialog";

const TYPES = ["building", "place", "segment"];
const BBOX = [-77.69, 39.13, -77.68, 39.15];
const ZIP_NAME = "overture-2024-09-18--77.690,39.130,-77.680,39.150.zip";

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
  describe("rendering", () => {
    it("shows the dialog title", () => {
      renderDialog();
      expect(screen.getByText("Confirm Download")).toBeInTheDocument();
    });

    it("lists each visible type", () => {
      renderDialog();
      TYPES.forEach((t) => expect(screen.getByText(t)).toBeInTheDocument());
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
