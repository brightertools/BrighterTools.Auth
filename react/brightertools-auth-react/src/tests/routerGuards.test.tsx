import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthGuard } from "../guards/AuthGuard";
import { OnboardingGuard } from "../guards/OnboardingGuard";

const state = vi.hoisted(() => ({ session: null as null | { onboarding?: { required: boolean } } }));
vi.mock("../hooks/useAuth", () => ({ useAuth: () => state }));
beforeEach(() => { state.session = null; });

const renderRoute = () => render(<MemoryRouter initialEntries={["/private"]}><Routes>
  <Route path="/private" element={<AuthGuard><OnboardingGuard>Private content</OnboardingGuard></AuthGuard>} />
  <Route path="/login" element={<div>Login destination</div>} />
  <Route path="/onboarding" element={<div>Onboarding destination</div>} />
</Routes></MemoryRouter>);

describe("Router 7 guards", () => {
  it("redirects an anonymous deep link to login", async () => {
    renderRoute();
    expect(await screen.findByText("Login destination")).not.toBeNull();
  });
  it("redirects incomplete onboarding", async () => {
    state.session = { onboarding: { required: true } };
    renderRoute();
    expect(await screen.findByText("Onboarding destination")).not.toBeNull();
  });
  it("renders authorized content", async () => {
    state.session = { onboarding: { required: false } };
    renderRoute();
    expect(await screen.findByText("Private content")).not.toBeNull();
  });
});
