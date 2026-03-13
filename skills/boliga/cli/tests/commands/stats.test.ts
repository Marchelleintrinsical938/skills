import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface StatsResponse {
  propertiesForSale: number;
  newToday: number;
  priceDropToday: number;
  newForeClosuresToday: number;
  newSelfsale24h: number;
  moreThanOtherPortals: number;
  selfsaleNumber: number;
  discreteNumber: number;
  onthewayNumber: number;
}

describe("stats command", () => {
  test("returns market data object", async () => {
    const result = await runCLI(["stats"]);
    const data = parseJSON<StatsResponse>(result);

    expect(data).toHaveProperty("propertiesForSale");
    expect(data).toHaveProperty("newToday");
    expect(data).toHaveProperty("priceDropToday");
  });

  test("propertiesForSale is a number greater than 0", async () => {
    const result = await runCLI(["stats"]);
    const data = parseJSON<StatsResponse>(result);

    expect(typeof data.propertiesForSale).toBe("number");
    expect(data.propertiesForSale).toBeGreaterThan(0);
  });

  test("newToday is a number greater than 0", async () => {
    const result = await runCLI(["stats"]);
    const data = parseJSON<StatsResponse>(result);

    expect(typeof data.newToday).toBe("number");
    expect(data.newToday).toBeGreaterThan(0);
  });

  test("all expected numeric fields are present", async () => {
    const result = await runCLI(["stats"]);
    const data = parseJSON<StatsResponse>(result);

    const numericFields: (keyof StatsResponse)[] = [
      "propertiesForSale",
      "newToday",
      "priceDropToday",
      "newForeClosuresToday",
      "newSelfsale24h",
      "moreThanOtherPortals",
      "selfsaleNumber",
      "discreteNumber",
      "onthewayNumber",
    ];

    for (const field of numericFields) {
      expect(data).toHaveProperty(field);
      expect(typeof data[field]).toBe("number");
    }
  });

  test("key market metrics are positive numbers", async () => {
    const result = await runCLI(["stats"]);
    const data = parseJSON<StatsResponse>(result);

    expect(data.propertiesForSale).toBeGreaterThan(0);
    expect(data.selfsaleNumber).toBeGreaterThan(0);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["stats", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("exits with code 0 on success", async () => {
    const result = await runCLI(["stats"]);
    expect(result.exitCode).toBe(0);
  });
});
