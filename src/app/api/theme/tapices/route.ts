import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const tapizPattern = /^tapiz-(\d+)\.png$/i;

export async function GET() {
  const imgDir = path.join(process.cwd(), "public", "img");

  try {
    const files = await fs.readdir(imgDir);
    const tapices = files
      .map((fileName) => {
        const match = fileName.match(tapizPattern);

        return match
          ? {
              index: Number(match[1]),
              path: `/img/${fileName}`,
            }
          : null;
      })
      .filter((item): item is { index: number; path: string } => Boolean(item))
      .sort((a, b) => a.index - b.index)
      .map((item) => item.path);

    return NextResponse.json({ tapices });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return NextResponse.json({ tapices: [] });
    }

    console.warn("theme tapices lookup failed", {
      error: error instanceof Error ? error.message : "Unknown tapices error",
    });

    return NextResponse.json({ tapices: [] }, { status: 500 });
  }
}
