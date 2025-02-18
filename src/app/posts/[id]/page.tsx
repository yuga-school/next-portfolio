"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { Category } from "@/app/_types/Category";
import DOMPurify from "isomorphic-dompurify";

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // 動的ルートパラメータから 記事id を取得 （URL:/posts/[id]）
  const { id } = useParams() as { id: string };
  // コンポーネントが読み込まれたときに「1回だけ」実行する処理
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const requestUrl = `/api/posts/${id}`;
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const postApiResponse: PostApiResponse = await response.json();
        console.log(postApiResponse)
        setPost({
            id: postApiResponse.id,
            title: postApiResponse.title,
            repository: postApiResponse.repository,
            app_url: postApiResponse.app_url,
            createdAt: postApiResponse.createdAt,
            article: postApiResponse.article,
            categories: postApiResponse.categories.map((category: Category) => ({
                id: category.id,
                name: category.name,
                detail: category.detail,
            })),
          });
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchPosts();
  }, [id]);
  if (fetchError) {
    return <div>{fetchError}</div>;
  }
  // 投稿データの取得中は「Loading...」を表示
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 投稿データが取得できなかったらエラーメッセージを表示
  if (!post) {
    return <div>指定idの投稿の取得に失敗しました。</div>;
  }
  console.log("safeHTML",post.article)
  // HTMLコンテンツのサニタイズ
type CoverImage = { type: "CoverImage"; url: string; width: number; height: number};
type Text = { type: "text"; text: string };
const safeHTML = post.article.map((item) => {
    if (item.type === "CoverImage" && item.url) {
        return {
            type: item.type,
            content: DOMPurify.sanitize(
                `<img src="${item.url}" width="${item.width}" height="${item.height}" alt="Cover Image" />`,
                {
                    ALLOWED_TAGS: ["img"],
                    ALLOWED_ATTR: ["src", "width", "height", "alt"],
                }
            ),
        };
    } else if (item.type === "text") {
        return {
            type: item.type,
            content: DOMPurify.sanitize(item.text || "", {
                ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
            }),
        };
    }
    return { type: item.type, content: "" };
});
  return (
    <main>
      <div className="space-y-2">
        <div className="mb-2 text-2xl font-bold">{post.title}</div>
        <div>
          リポジトリのリンク:{" "}
          <a href={post.repository} target="_blank" rel="noopener noreferrer">
            {post.repository}
          </a>
        </div>
        <div>
          アプリのリンク:{" "}
          <a href={post.app_url} target="_blank" rel="noopener noreferrer">
            {post.app_url}
          </a>
        </div>
        {safeHTML.map((html, index) => (
          <div key={index} dangerouslySetInnerHTML={{ __html: html.content }} />
        ))}
      </div>
    </main>
  );
};

export default Page;