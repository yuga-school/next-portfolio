"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目
import type { Post } from "@/app/_types/Post";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
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
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex justify-center">
        <div className="space-y-4 w-full max-w-2xl">
                <h1 className="p-4 sm:p-6 my-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-center border-b-4 border-blue-500 bg-gradient-to-r from-blue-400 to-blue-300 text-white shadow-lg rounded-md">
                  {post.title}
                </h1>
            <div className="p-4 border rounded-md bg-blue-100">
            リポジトリのリンク:{" "}
            <a href={post.repository} target="_blank" rel="noopener noreferrer">
              {post.repository}
            </a>
            </div>
          <div className="p-4 border rounded-md bg-blue-100">
            アプリのリンク:{" "}
            <a href={post.app_url} target="_blank" rel="noopener noreferrer">
              {post.app_url}
            </a>
          </div>
            {safeHTML.map((html, index) => (
                <div key={index}>
                {html.type === "text" ? (
                  <div className="p-4 border rounded-md bg-gray-100" dangerouslySetInnerHTML={{ __html: html.content }} />
                ) : (
                  <div className="p-4 border rounded-md border-gray-900" dangerouslySetInnerHTML={{ __html: html.content }} />
                )}
                </div>
            ))}
        </div>
      </div>
    </main>
  );
};

export default Page;