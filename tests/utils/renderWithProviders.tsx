import { render, type RenderResult } from "@testing-library/react";
import type { ReactNode } from "react";
import { AllProviders } from "./AllProviders";

export function renderWithProviders(ui: ReactNode, route = "/"): RenderResult {
  return render(<AllProviders route={route}>{ui}</AllProviders>);
}
