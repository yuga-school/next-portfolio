import prisma from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@prisma/client";
import { CoverImage } from "@/app/_types/CoverImage";
import { text } from "@/app/_types/text";
import { supabase } from "@/utils/supabase";
type RouteParams = {
  params: {
    id: string;
  };
};

// ▼▼ 追記: ここから
type RequestBody = {
  title: string;
  repository: string;
  app_url: string;
  article: (CoverImage | text)[];
  categoryIds: string[];
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const id = routeParams.params.id;
    const requestBody: RequestBody = await req.json();

    // 分割代入
    const { title, repository,app_url,article, categoryIds } = requestBody;

    // categoryIds に該当するカテゴリが存在するか確認
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
    });
    if (categories.length !== categoryIds.length) {
      throw new Error("指定されたカテゴリが存在しません");
    }

    // 中間テーブルのレコードを削除
    await prisma.postCategory.deleteMany({
      where: { postId: id },
    });

    // 投稿記事テーブルにレコードを追加
    const post: Post = await prisma.post.update({
      where: { id },
      data: {
        title, // title: title の省略形であることに注意。以下も同様
        repository,
        app_url,
        article,
      },
    });

    // 中間テーブルにレコードを追加
    for (const categoryId of categoryIds) {
      await prisma.postCategory.create({
        data: {
          postId: post.id,
          categoryId: categoryId,
        },
      });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の変更に失敗しました" },
      { status: 500 }
    );
  }
};
// ▲▲ 追記: ここまで

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const token = req.headers.get("Authorization") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 401 });
  try {
    const id = routeParams.params.id;
    const post: Post = await prisma.post.delete({
      where: { id },
    });
    return NextResponse.json({ msg: `「${post.title}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の削除に失敗しました" },
      { status: 500 }
    );
  }
};