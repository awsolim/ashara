import { NextResponse } from "next/server";
import { getArabicJalalaynTafsirRange } from "@/lib/quran";

export async function GET() {
  try {
    const data = await getArabicJalalaynTafsirRange(67, 1, 5);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}