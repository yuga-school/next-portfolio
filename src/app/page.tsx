"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";

type User = {
  name: string;
  country: string;
  age: string;
  affiliation: string;
  links: { url: string; icon: string }[];
};

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDetails1, setShowDetails1] = useState<boolean>(false);
  const [showDetails2, setShowDetails2] = useState<boolean>(false);
  const [showDetails3, setShowDetails3] = useState<boolean>(false);
  const [subposts, setsubPosts] = useState<Post[] | null>(null);
  const [categories, setcategories] = useState<string[] | null>(null);
  const [searchQuery, setSearchQuery] = useState<string[] | null>(null);
  const [keyword, setkeyword] = useState<string>("");
  const [searchMode, setSearchMode] = useState<"OR" | "AND">("OR");
  const [user, setUser] = useState<User | null>(null);
  const handleSearch = () => {
    const filteredPosts = posts?.filter((post) => {
      const queryWords = searchQuery;
      if (searchMode === "OR") {
        return queryWords?.some((word) =>
          post.categories.some((category) => category.name.includes(word))
        );
      } else {
        return queryWords?.every((word) =>
          post.categories.some((category) => category.name.includes(word))
        );
      }
    });
    setsubPosts(filteredPosts || null);
  };

  const getEditDistance = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, () =>
      Array(b.length + 1).fill(0)
    );

    const lowerA = a.toLowerCase();
    const lowerB = b.toLowerCase();

    for (let i = 0; i <= lowerA.length; i++) {
      for (let j = 0; j <= lowerB.length; j++) {
        if (i === 0) {
          matrix[i][j] = j;
        } else if (j === 0) {
          matrix[i][j] = i;
        } else if (lowerA[i - 1] === lowerB[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] =
            1 +
            Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
        }
      }
    }

    return matrix[lowerA.length][lowerB.length];
  };
  const getTopCategories = (searchQuery: string): string[] => {
    const queryWords = searchQuery;
    const categoryArray = categories;
    const categoryDistances: { category: string; distance: number }[] = [];
    categoryArray?.forEach((category) => {
      const distance = getEditDistance(queryWords, category);
      categoryDistances.push({
        category,
        distance: distance / Number(category.length),
      });
    });

    categoryDistances.sort((a, b) => a.distance - b.distance);

    return categoryDistances.slice(0, 10).map((item) => item.category);
  };
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const requestUrl = `/api/user`;
        const response = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("ユーザー情報の取得に失敗しました");
        }
        const userData: User[] = await response.json();
        setUser(userData[0]);
      } catch (error) {
        setFetchError(
          error instanceof Error ? error.message : "予期せぬエラーが発生しました"
        );
      }
    };
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
        const categoriesSet = new Set<string>();
        postResponse?.map((post) => {
          post.categories.map((category:any) => {
            categoriesSet.add(category.category.name);
          });
        });
        console.log(categories)
        setcategories(Array.from(categoriesSet));
        setsubPosts(posts);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchUser();
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
  const addKeyword = (keyword: string) => {
    setSearchQuery((prev) => {
      if (!prev?.includes(keyword)) {
        return prev ? [...prev, keyword] : [keyword];
      }
      return prev;
    });
  };

  const removeKeyword = (keyword: string) => {
    setSearchQuery((prev) => prev?.filter((k) => k !== keyword) || null);
  };
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
          <strong>{user?.name}</strong>
        </div>
        <div className="flex space-x-4 bg-gray-100 p-1 rounded-lg shadow-inner">
          {user?.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-75 transition-opacity duration-200"
            >
              <img
                src={link.icon}
                alt={`Link to ${link.url}`}
                className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
              />
            </a>
          ))}
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
                {user?.country}
              </div>
            </details>
            <details className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
              <summary className="text-lg font-serif cursor-pointer">Age/Grade</summary>
              <div className="mt-2 p-2 font-serif text-lg">
                {user?.age}
              </div>
            </details>
            <details className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner text-left open:bg-blue-300">
              <summary className="text-lg font-serif cursor-pointer">Affiliation</summary>
              <div className="mt-2 p-2 font-serif text-lg">
                {user?.affiliation}
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
            <input
              type="text"
              value={keyword}
              onChange={(e) => setkeyword(e.target.value)}
              placeholder="検索語句を入力"
              className="mr-2 border p-2"
            />
            <div className="mt-2">
              <div className="mb-2 font-bold">キーワード一覧</div>
              <div className="flex flex-wrap">
                {searchQuery?.map((keyword, index) => (
                  <div key={index} className="relative mb-2 mr-2">
                    <span className="rounded bg-gray-200 px-2 py-1 text-sm">
                      {keyword}
                    </span>
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="absolute right-0 top-0 -mr-1 -mt-1 rounded-full bg-red-500 p-1 text-xs text-white opacity-50 hover:bg-red-600 hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2">
              <div className="mb-2 font-bold">カテゴリ候補</div>
              <div className="flex flex-wrap">
                {getTopCategories(keyword).map((category, index) => (
                  <button
                    key={index}
                    onClick={() => addKeyword(category)}
                    className="mb-2 mr-2 rounded bg-blue-200 px-2 py-1 text-sm hover:bg-blue-300"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <select
              value={searchMode}
              onChange={(e) => setSearchMode(e.target.value as "OR" | "AND")}
              className="mr-2 border p-2"
            >
              <option value="OR">OR</option>
              <option value="AND">AND</option>
            </select>
            <button onClick={handleSearch} className="bg-blue-500 p-2 text-white">
              検索
            </button>
            {subposts && (
              <span className="ml-2">
                {subposts?.length} 件の投稿が見つかりました
              </span>
            )}
            <br />
            {subposts?.map((post) => (
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
