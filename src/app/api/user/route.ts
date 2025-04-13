import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

export const revalidate = 0;

export const GET = async (req: NextRequest) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        links: true,
        country: true,
        age: true,
        affiliation: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
};