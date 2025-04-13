import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/utils/supabase";

type RequestBody = {
  name: string;
  links: { url: string; icon: string }[];
  country: string;
  age: string;
  affiliation: string;
};

export const POST = async (req: NextRequest) => {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });

  try {
    const requestBody: RequestBody = await req.json();

    // 分割代入
    const { name, links, country, age, affiliation } = requestBody;

    // ユーザーを作成
    const user = await prisma.user.create({
      data: {
        name,
        links,
        country,
        age,
        affiliation,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "ユーザーの作成に失敗しました" },
      { status: 500 }
    );
  }
};
