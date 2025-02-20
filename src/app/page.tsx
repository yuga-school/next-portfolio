"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDetails1, setShowDetails1] = useState<boolean>(false);
  const [showDetails2, setShowDetails2] = useState<boolean>(false);
  const [showDetails3, setShowDetails3] = useState<boolean>(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const requestUrl = `/api/posts`;
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("データの取得に失敗しました");
        }
        const postResponse: PostApiResponse[] = await response.json();
        console.log(postResponse)
        setPosts(
          postResponse.map((rawPost) => ({
            id: rawPost.id,
            title: rawPost.title,
            repository: rawPost.repository,
            app_url: rawPost.app_url,
            createdAt: rawPost.createdAt,
            article: rawPost.article,
            categories: rawPost.categories.map((category: any) => ({
              id: category.category.id,
              name: category.category.name || "No Name",
              detail: category.category.detail || "No Detail",
            })),
          }))
        );
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchPosts();
  }, []);
  if (fetchError) {
    return <div>{fetchError}</div>;
  }
  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }
  console.log(posts)
  return (
    <main className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="self-end mb-4">
        <Link href="/admin" className="text-blue-500 underline">
          管理者機能
        </Link>
      </div>
      <div className="bg-blue-300 p-4 rounded-lg shadow-md mb-4 flex flex-col items-center w-full max-w-2xl">
        <img src="/githubicon.png" alt="GitHub Icon" className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 mb-4" />
        <div className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-4 text-orange-800">
          <strong>Higashi Yuga</strong>
        </div>
      </div>
      <div className="w-full max-w-2xl mb-4">
        <button
          className="w-full p-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-700 ease-in-out hover:bg-blue-700 flex justify-between items-center"
          onClick={() => setShowDetails1(!showDetails1)}
        >
          <span className="mx-auto text-xl sm:text-2xl font-serif">Personal Information</span>
          <span className="ml-2">{showDetails1 ? '-' : '+'}</span>
        </button>
        {showDetails1 && (
          <div>
            <details className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
              <summary className="text-lg font-serif cursor-pointer">Country/Region</summary>
              <div className="mt-2 p-2 font-serif text-lg">
                Japan
              </div>
            </details>
            <details className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
              <summary className="text-lg font-serif cursor-pointer">Age/Grade</summary>
              <div className="mt-2 p-2 font-serif text-lg">
                18/3
              </div>
            </details>
            <details className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
              <summary className="text-lg font-serif cursor-pointer">Affiliation</summary>
              <div className="mt-2 p-2 font-serif text-lg">
                Osaka Metropolitan University College of Technology
              </div>
            </details>
          </div>
        )}
      </div>
      <div className="w-full max-w-2xl mb-4">
        <button
          className="w-full p-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-700 ease-in-out hover:bg-blue-700 flex justify-between items-center"
          onClick={() => setShowDetails2(!showDetails2)}
        >
          <span className="mx-auto text-xl sm:text-2xl font-serif">Skill</span>
          <span className="ml-2">{showDetails2 ? '-' : '+'}</span>
        </button>
        {showDetails2 && (
          <div>
            {Array.from(new Set(posts.flatMap(post => post.categories.map(category => category.name)))).map(categoryName => (
              <div key={categoryName} className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
                <h3 className="text-lg font-serif">{categoryName}</h3>
                <details className="mt-2 p-2 rounded-lg bg-gray-200 shadow-inner">
                  <div className="mt-1 p-1 font-serif text-lg">
                    {posts.flatMap(post => post.categories.filter(category => category.name === categoryName))[0].detail}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-full max-w-2xl mb-4">
        <button
          className="w-full p-4 bg-blue-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-700 ease-in-out hover:bg-blue-700 flex justify-between items-center"
          onClick={() => setShowDetails3(!showDetails3)}
        >
          <span className="mx-auto text-xl sm:text-2xl font-serif">Production</span>
          <span className="ml-2">{showDetails3 ? '-' : '+'}</span>
        </button>
        {showDetails3 && (
          <div className="space-y-3 w-full">
            <br />
            {posts.map((post) => (
              <PostSummary key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
      <div className="mb-1 flex justify-end w-full">
      </div>
    </main>
  );
};
export default Page;
