"use client";
import type { Post } from "@/app/_types/Post";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
type Props = {
  post: Post;
};

const PostSummary: React.FC<Props> = (props) => {
  const { post } = props;
  const repsafeHTML = DOMPurify.sanitize(post.repository, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });
  const appsafeHTML = DOMPurify.sanitize(post.app_url, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300 mx-2">
      <div className="flex items-center justify-between">
        <Link href={`/posts/${post.id}`}>
          <div className="mb-1 text-lg font-bold">{post.title}</div>
        </Link>
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
              {category.name}
            </div>
          ))}
        </div>
      </div>
        <div>
            リポジトリのリンク
            <a
                href={post.repository}
                className="text-blue-500 underline"
                dangerouslySetInnerHTML={{ __html: repsafeHTML }}
            />
        </div>
        <div>
            アプリのリンク
            <a
                href={post.app_url}
                className="text-blue-500 underline"
                dangerouslySetInnerHTML={{ __html: appsafeHTML }}
            />
        </div>
    </div>
  );
};

export default PostSummary;