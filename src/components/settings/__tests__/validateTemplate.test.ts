import { describe, it, expect } from "vitest";
import { validateTemplate } from "../validateTemplate";
import { evChargerTemplate } from "@/templates/evChargerTemplate";

describe("validateTemplate", () => {
  it("accepts the native EV template", () => {
    expect(validateTemplate(evChargerTemplate.steps, evChargerTemplate.photoSlots)).toBeNull();
  });
  it("rejects choice fields without options", () => {
    const steps = [{ id: "a", title: "A", fields: [{ id: "x", label: "Tipo", type: "pills" as const }] }];
    expect(validateTemplate(steps, [])).toMatch(/precisa de opções/);
  });
  it("rejects photo slots without title", () => {
    const steps = [{ id: "a", title: "A", fields: [{ id: "x", label: "Nome", type: "text" as const }] }];
    expect(validateTemplate(steps, [{ id: "p", title: " ", instruction: "", required: true }])).toMatch(/título/);
  });
});
