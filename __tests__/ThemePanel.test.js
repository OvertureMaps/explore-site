import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ThemePanel from "@/components/inspector_panel/ThemePanel";

const GERS_ID = "3b115ca6-ca2e-4704-9d05-941563714caf";

function renderPanel(entity) {
  return render(
    <ThemePanel
      mode="light"
      entity={{ theme: "places", type: "place", ...entity }}
      tips={{}}
    />
  );
}

describe("ThemePanel GERS ID", () => {
  it.each([
    ["places", "place"],
    ["buildings", "building"],
    ["transportation", "segment"],
    ["transportation", "connector"],
    ["divisions", "division"],
    ["divisions", "division_area"],
    ["divisions", "division_boundary"],
  ])("links a %s/%s ID to its gers.page page in a new tab", (theme, type) => {
    renderPanel({ theme, type, id: GERS_ID });

    expect(screen.getByText(GERS_ID)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: `View GERS ID ${GERS_ID} on gers.page` });
    expect(link).toHaveAttribute("href", `https://gers.page/id/${GERS_ID}`);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it.each([
    ["base", "land"],
    ["base", "water"],
    ["addresses", "address"],
    ["buildings", "building_part"],
  ])("shows a %s/%s ID without a gers.page link", (theme, type) => {
    renderPanel({ theme, type, id: GERS_ID });

    expect(screen.getByText(GERS_ID)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /gers\.page/ })).not.toBeInTheDocument();
  });

  it("omits the gers.page link when the feature has no ID", () => {
    renderPanel({});

    expect(screen.queryByRole("link", { name: /gers\.page/ })).not.toBeInTheDocument();
  });
});
