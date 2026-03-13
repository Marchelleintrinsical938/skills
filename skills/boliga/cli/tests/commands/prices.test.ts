import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "../helpers";

interface RkrQuarterData {
  date: string;
  value: number;
  changeSinceLastQuarter: number;
  changeSinceLastYear: number;
  changeSince1995: number;
}

interface PriceDataEntry {
  rkrQuarterData: RkrQuarterData;
}

interface AreaListEntry {
  id: number;
  rrIdentifier: string;
  rrText: string;
  eiText: string;
  sort: number;
}

interface SalesPricesChartEntry {
  id: number;
  quarter: {
    id: number;
    date: string;
  };
  area: number;
  dataType: number;
  propertyType: number;
  value: number;
}

interface PricesResponse {
  data: PriceDataEntry[];
  areaList: AreaListEntry[];
  salesPricesChartData: SalesPricesChartEntry[];
}

describe("prices command", () => {
  test("returns historical price data with data array", async () => {
    const result = await runCLI(["prices"]);
    const data = parseJSON<PricesResponse>(result);

    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  test("response has areaList and salesPricesChartData", async () => {
    const result = await runCLI(["prices"]);
    const data = parseJSON<PricesResponse>(result);

    expect(data).toHaveProperty("areaList");
    expect(data).toHaveProperty("salesPricesChartData");
    expect(Array.isArray(data.areaList)).toBe(true);
    expect(Array.isArray(data.salesPricesChartData)).toBe(true);
  });

  test("data entries have rkrQuarterData with expected fields", async () => {
    const result = await runCLI(["prices", "--limit", "5"]);
    const data = parseJSON<PricesResponse>(result);

    expect(data.data.length).toBeGreaterThan(0);
    for (const entry of data.data) {
      expect(entry).toHaveProperty("rkrQuarterData");
      const rkr = entry.rkrQuarterData;
      expect(typeof rkr.date).toBe("string");
      expect(typeof rkr.value).toBe("number");
      expect(typeof rkr.changeSinceLastQuarter).toBe("number");
      expect(typeof rkr.changeSinceLastYear).toBe("number");
      expect(typeof rkr.changeSince1995).toBe("number");
    }
  });

  test("rkrQuarterData value (kr/m²) is a positive number", async () => {
    const result = await runCLI(["prices", "--limit", "3"]);
    const data = parseJSON<PricesResponse>(result);

    expect(data.data.length).toBeGreaterThan(0);
    for (const entry of data.data) {
      expect(entry.rkrQuarterData.value).toBeGreaterThan(0);
    }
  });

  test("filter by property type and area returns filtered data", async () => {
    const result = await runCLI([
      "prices",
      "--property-type",
      "1",
      "--area-type",
      "zip",
      "--area-id",
      "2100",
    ]);
    const data = parseJSON<PricesResponse>(result);

    expect(data).toHaveProperty("data");
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
  });

  test("--limit caps number of data points returned", async () => {
    const result = await runCLI(["prices", "--limit", "5"]);
    const data = parseJSON<PricesResponse>(result);

    expect(data.data.length).toBeLessThanOrEqual(5);
  });

  test("national data returns many quarters (~135)", async () => {
    const result = await runCLI(["prices"]);
    const data = parseJSON<PricesResponse>(result);

    // National data goes back to ~1992, expect many data points
    expect(data.data.length).toBeGreaterThan(50);
  });

  test("--format plain outputs without error", async () => {
    const result = await runCLI(["prices", "--limit", "3", "--format", "plain"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.length).toBeGreaterThan(0);
  });

  test("areaList entries have expected fields when not empty", async () => {
    const result = await runCLI([
      "prices",
      "--property-type",
      "1",
      "--area-type",
      "zip",
      "--area-id",
      "2100",
    ]);
    const data = parseJSON<PricesResponse>(result);

    if (data.areaList.length > 0) {
      const area = data.areaList[0];
      expect(typeof area.id).toBe("number");
      expect(typeof area.rrIdentifier).toBe("string");
      expect(typeof area.rrText).toBe("string");
    }
  });
});
