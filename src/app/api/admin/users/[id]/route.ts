import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";

type RouteParams = {
  params: {
    id: string;
  };
};

type Link = {
  url: string;
  icon: string;
};

type RequestBody = {
  name: string;
  country: string;
  age: string;
  affiliation: string;
  links: Link[];
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const id = routeParams.params.id;
    const { name, country, age, affiliation, links }: RequestBody = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        country,
        age,
        affiliation,
        links: links as any, // JSON 型として保存
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("ユーザー更新エラー:", error);
    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました" },
      { status: 500 }
    );
  }
};