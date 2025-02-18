"use client";
import { useState } from "react";
import type { Post } from "@/app/_types/Post";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
type Props = {
  post: Post;
  reloadAction: () => Promise<void>;
  setIsSubmitting: (isSubmitting: boolean) => void;
};

const AdminPostSummary: React.FC<Props> = (props) => {
  const { post } = props;
  const dtFmt = "YYYY-MM-DD";
  const { token } = useAuth();
  // 「削除」のボタンが押下されたときにコールされる関数
  const handleDelete = async (post: Post) => {
    // prettier-ignore
    if (!window.confirm(`投稿記事「${post.title}」を本当に削除しますか？`)) {
      return;
    }
    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      props.setIsSubmitting(true);
      const requestUrl = `/api/admin/posts/${post.id}`;
      const res = await fetch(requestUrl, {
        method: "DELETE",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      });

      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      await props.reloadAction();
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のDELETEリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      props.setIsSubmitting(false);
    }
  };

  return (
    <div className="border border-slate-400 p-3">
      <div className="flex items-center justify-between">
        <div>{dayjs(post.createdAt).format(dtFmt)}</div>
        <div className="flex space-x-1.5">
          {post.categories.map((category) => (
            <div
              key={category.id}
              className={twMerge(
                "rounded-md px-2 py-0.5",
                "text-xs font-bold",
                "border border-slate-400 text-slate-500"
              )}
            >
              <Link href={`/admin/categories/${category.id}`}>
                {category.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
      <Link href={`/posts/${post.id}`}>
        <div className="mb-1 text-lg font-bold">{post.title}</div>
        <br/>
        <div>
          リポジトリのリンク
          <a
            href={post.repository}
            className="text-blue-500 underline"
            dangerouslySetInnerHTML={{ __html: post.repository }}
          />
        </div>
        <br/>
        <div>
          アプリのリンク
          <a
            href={post.repository}
            className="text-blue-500 underline"
            dangerouslySetInnerHTML={{ __html: post.app_url }}
          />
        </div>
      </Link>
      <div className="flex justify-end space-x-2">
        <Link href={`/admin/posts/${post.id}`}>
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600"
            )}
          >
            編集
          </button>
        </Link>

        <button
          type="button"
          className={twMerge(
            "rounded-md px-5 py-1 font-bold",
            "bg-red-500 text-white hover:bg-red-600"
          )}
          onClick={() => {
            handleDelete(post);
          }}
        >
          削除
        </button>
      </div>
    </div>
  );
};

export default AdminPostSummary;