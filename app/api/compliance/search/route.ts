import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// Type for HS code entry from JSON
interface HSCodeEntry {
  hs_code: string;
  english_name: string;
  amharic_name: string;
  category: string;
  rates: {
    "2026": string;
    "2027": string;
    "2028": string;
    "2029": string;
    "2030": string;
  };
}

// Cache the loaded data
let cachedData: HSCodeEntry[] | null = null;

async function loadHSCodeData(): Promise<HSCodeEntry[]> {
  if (cachedData) {
    return cachedData;
  }

  const filePath = path.join(process.cwd(), "category_a_detailed_2026_2030.json");
  const fileContent = await fs.readFile(filePath, "utf-8");
  cachedData = JSON.parse(fileContent);
  return cachedData!;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q")?.toLowerCase().trim() || "";
    const hsCode = searchParams.get("hs_code")?.trim() || "";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const data = await loadHSCodeData();

    // If looking up a specific HS code
    if (hsCode) {
      const entry = data.find((item) => item.hs_code === hsCode);
      if (entry) {
        return NextResponse.json({
          success: true,
          data: entry,
          isCompliant: true, // If found in this file, it's Category A compliant
        });
      } else {
        return NextResponse.json({
          success: true,
          data: null,
          isCompliant: false, // Not found in Category A
        });
      }
    }

    // Search by query (name or HS code)
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        message: "Please enter at least 2 characters to search",
      });
    }

    const results = data
      .filter((item) => {
        const matchesName = item.english_name.toLowerCase().includes(query) ||
          item.amharic_name.includes(query);
        const matchesCode = item.hs_code.includes(query);
        return matchesName || matchesCode;
      })
      .slice(0, limit)
      .map((item) => ({
        hsCode: item.hs_code,
        englishName: item.english_name,
        amharicName: item.amharic_name,
        category: item.category,
        rates: item.rates,
        currentRate: item.rates["2026"], // Current year
      }));

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Compliance search API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search HS codes",
      },
      { status: 500 }
    );
  }
}
