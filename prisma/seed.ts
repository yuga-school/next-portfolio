import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); // PrismaClientのインスタンス生成

const main = async () => {
  // 各テーブルから既存の全レコードを削除
  await prisma.postCategory?.deleteMany();
  await prisma.post?.deleteMany();
  await prisma.category?.deleteMany();

  // カテゴリデータの作成 (テーブルに対するレコードの挿入)
  const c1 = await prisma.category.create({ data: { name: "カテゴリ1", detail: "カテゴリ1の詳細" } });
  const c2 = await prisma.category.create({ data: { name: "カテゴリ2", detail: "カテゴリ1の詳細" } });
  // const c3 = await prisma.category.create({ data: { name: "カテゴリ3", detail: "カテゴリ1の詳細" } });

  // 投稿記事データの作成  (テーブルに対するレコードの挿入)
const p1 = await prisma.post.create({
    data: {
        title: "投稿1",
        repository: "none",
        app_url: "none",
        article: [
            {
                type: "CoverImage",
                url: "https://w1980.blob.core.windows.net/pg3/cover-img-red.jpg",
                height: 768,
                width: 1365,
            },
            {
                type: "text",
                text: "投稿1の本文。<br/>投稿1の本文。投稿1の本文。",
            },
        ],
        categories: {
            create: [{ categoryId: c1.id }, { categoryId: c2.id }],
        },
    },
});
  console.log(JSON.stringify(p1, null, 2));
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });