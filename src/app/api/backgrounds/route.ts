import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const BACKGROUND_DIR = path.join(
  process.cwd(),
  "public",
  "image",
  "purikura-background"
);

export async function GET() {
  try {
    const entries = await fs.readdir(BACKGROUND_DIR, { withFileTypes: true });
    const backgrounds = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".webp"))
      .map((entry) => `/image/purikura-background/${entry.name}`)
      .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error("Failed to list backgrounds", error);
    return NextResponse.json(
      { error: "Failed to load backgrounds." },
      { status: 500 }
    );
  }
}
