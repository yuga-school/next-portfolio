"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { PostApiResponse } from "@/app/_types/PostApiResponse";
import { CoverImage } from "@/app/_types/CoverImage";
import { text } from "@/app/_types/text";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import CryptoJS from "crypto-js";
import Image from "next/image";

// カテゴリをフェッチしたときのレスポンスのデータ型
type RawApiCategoryResponse = {
  id: string;
  name: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
};

// 投稿記事のカテゴリ選択用のデータ型
type SelectableCategory = {
  id: string;
  name: string;
  detail: string;
  isSelect: boolean;
};

const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
};

// 投稿記事の編集ページ
const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newrepository, setNewrepository] = useState("");
  const [newapp_url, setNewapp_url] = useState("");
  const [newarticle, setNewarticle] = useState<(CoverImage | text)[] | null>(null);

  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { token } = useAuth();

  const [checkableCategories, setCheckableCategories] = useState<SelectableCategory[] | null>(null);
  const [rawApiPostResponse, setRawApiPostResponse] = useState<PostApiResponse | null>(null);

  // 各CoverImage項目用のファイル入力を管理するためのrefオブジェクト
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // 投稿記事取得
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const requestUrl = `/api/posts/${id}`;
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setRawApiPostResponse(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as PostApiResponse;
        setRawApiPostResponse(apiResBody);
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `投稿記事の取得に失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchPost();
  }, [id]);

  // カテゴリ一覧の取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const requestUrl = "/api/categories";
        const res = await fetch(requestUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          setCheckableCategories(null);
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        const apiResBody = (await res.json()) as RawApiCategoryResponse[];
        setCheckableCategories(
          apiResBody.map((body) => ({
            id: body.id,
            name: body.name,
            detail: body.detail,
            isSelect: false,
          }))
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
            : `予期せぬエラーが発生しました ${error}`;
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };
    fetchCategories();
  }, []);

  // 投稿記事のデータ取得後、各項目の初期化
  useEffect(() => {
    if (isInitialized) return;
    if (!rawApiPostResponse || !checkableCategories) return;

    setNewTitle(rawApiPostResponse.title);
    setNewrepository(rawApiPostResponse.repository);
    setNewapp_url(rawApiPostResponse.app_url);
    setNewarticle(rawApiPostResponse.article);

    const selectedIds = new Set(rawApiPostResponse.categories.map((c) => c.id));
    setCheckableCategories(
      checkableCategories.map((category) => ({
        ...category,
        isSelect: selectedIds.has(category.id),
      }))
    );
    setIsInitialized(true);
  }, [isInitialized, rawApiPostResponse, checkableCategories]);

  const switchCategoryState = (categoryId: string) => {
    if (!checkableCategories) return;
    setCheckableCategories(
      checkableCategories.map((category) =>
        category.id === categoryId ? { ...category, isSelect: !category.isSelect } : category
      )
    );
  };

  const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value);
  };
  const updateNewrepository = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewrepository(e.target.value);
  };
  const updateNewapp_url = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewapp_url(e.target.value);
  };

  // ファイル選択時の処理（インデックス指定）
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileHash = await calculateMD5Hash(file);
    const path = `private/${fileHash}`;
    const { data, error } = await supabase.storage
      .from("cover_image")
      .upload(path, file, { upsert: true });
  
    if (error || !data) {
      window.alert(`アップロードに失敗 ${error.message}`);
      return;
    }
    const publicUrlResult = supabase.storage.from("cover_image").getPublicUrl(data.path);
    const newUrl = publicUrlResult.data.publicUrl;
    
    // newarticle配列内の該当CoverImageのurlのみ更新
    setNewarticle(prev => {
      if (!prev) return prev;
      return prev.map((item, i) => {
        if (i === index && item.type === "CoverImage") {
          return { ...item, url: newUrl };
        }
        return item;
      });
    });
  };

  // フォーム送信時の処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!token) {
        window.alert("予期せぬ動作：トークンが取得できません。");
        return;
      }
      const requestBody = {
        title: newTitle,
        repository: newrepository,
        app_url: newapp_url,
        article: newarticle,
        categoryIds: checkableCategories
          ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
          : [],
      };
      const requestUrl = `/api/admin/posts/${id}`;
      console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
      const res = await fetch(requestUrl, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestBody),
      });
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      setIsSubmitting(false);
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error
          ? `投稿記事のPUTリクエストに失敗しました\n${error.message}`
          : `予期せぬエラーが発生しました\n${error}`;
      console.error(errorMsg);
      window.alert(errorMsg);
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-4 text-2xl font-bold">制作物の編集・削除</div>

      {isSubmitting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
            <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin text-gray-500" />
            <div className="flex items-center text-gray-500">処理中...</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={twMerge("space-y-4", isSubmitting && "opacity-50")}>
        <div className="space-y-1">
          <label htmlFor="title" className="block font-bold">タイトル</label>
          <input
            type="text"
            id="title"
            name="title"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newTitle}
            onChange={updateNewTitle}
            placeholder="タイトルを記入してください"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="repository" className="block font-bold">リポジトリのリンク</label>
          <input
            type="text"
            id="repository"
            name="repository"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newrepository}
            onChange={updateNewrepository}
            placeholder="リポジトリのリンクを記入してください"
            required
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="app_url" className="block font-bold">アプリのリンク</label>
          <input
            type="text"
            id="app_url"
            name="app_url"
            className="w-full rounded-md border-2 px-2 py-1"
            value={newapp_url}
            onChange={updateNewapp_url}
            placeholder="アプリのリンクを記入してください"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="block font-bold">本文</label>
          {newarticle?.map((item, index) => {
            if (item.type === "CoverImage") {
              const coverImage = item as CoverImage;
              return (
                <div key={index} className="space-y-1">
                  <label className="block font-bold">カバーイメージ (URL)</label>
                  {/* ファイル入力はhidden、個別のrefを利用 */}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleImageChange(e, index)}
                  />
                  <button
                    type="button"
                    className="rounded-md bg-indigo-500 px-3 py-1 text-white"
                    onClick={() => fileInputRefs.current[index]?.click()}
                  >
                    ファイルを選択
                  </button>
                  <input
                    type="url"
                    id={`coverImageURL-${index}`}
                    name={`coverImageURL-${index}`}
                    className="w-full rounded-md border-2 px-2 py-1"
                    value={coverImage.url || ""}
                    onChange={(e) => {
                      const updatedArticle = [...(newarticle || [])];
                      (updatedArticle[index] as CoverImage).url = e.target.value;
                      setNewarticle(updatedArticle);
                    }}
                    placeholder="カバーイメージのURLを記入してください"
                    required
                  />
                  {coverImage.url && (
                    <div className="mt-2">
                      <Image
                        className="w-1/2 border-2 border-gray-300"
                        src={coverImage.url}
                        alt="プレビュー画像"
                        width={1024}
                        height={1024}
                        priority
                      />
                    </div>
                  )}
                  <label htmlFor={`coverImageWidth-${index}`} className="block font-bold">幅</label>
                  <input
                    type="number"
                    id={`coverImageWidth-${index}`}
                    name={`coverImageWidth-${index}`}
                    className="w-full rounded-md border-2 px-2 py-1"
                    value={coverImage.width}
                    onChange={(e) => {
                      const updatedArticle = [...(newarticle || [])];
                      (updatedArticle[index] as CoverImage).width = Number(e.target.value);
                      setNewarticle(updatedArticle);
                    }}
                    placeholder="幅を記入してください"
                    required
                  />
                  <label htmlFor={`coverImageHeight-${index}`} className="block font-bold">高さ</label>
                  <input
                    type="number"
                    id={`coverImageHeight-${index}`}
                    name={`coverImageHeight-${index}`}
                    className="w-full rounded-md border-2 px-2 py-1"
                    value={coverImage.height}
                    onChange={(e) => {
                      const updatedArticle = [...(newarticle || [])];
                      (updatedArticle[index] as CoverImage).height = Number(e.target.value);
                      setNewarticle(updatedArticle);
                    }}
                    placeholder="高さを記入してください"
                    required
                  />
                  <button
                    type="button"
                    className="mt-2 rounded-md bg-red-500 px-4 py-2 text-white"
                    onClick={() => {
                      const updatedArticle = newarticle!.filter((_, i) => i !== index);
                      setNewarticle(updatedArticle);
                    }}
                  >
                    削除
                  </button>
                </div>
              );
            } else if (item.type === "text") {
              const textItem = item as text;
              return (
                <div key={index} className="space-y-1">
                  <label htmlFor={`text-${index}`} className="block font-bold">テキスト</label>
                  <textarea
                    id={`text-${index}`}
                    name={`text-${index}`}
                    className="h-48 w-full rounded-md border-2 px-2 py-1"
                    value={textItem.text}
                    onChange={(e) => {
                      const updatedArticle = [...(newarticle || [])];
                      (updatedArticle[index] as text).text = e.target.value;
                      setNewarticle(updatedArticle);
                    }}
                    placeholder="本文を記入してください"
                    required
                  />
                  <button
                    type="button"
                    className="mt-2 rounded-md bg-red-500 px-4 py-2 text-white"
                    onClick={() => {
                      const updatedArticle = newarticle!.filter((_, i) => i !== index);
                      setNewarticle(updatedArticle);
                    }}
                  >
                    削除
                  </button>
                </div>
              );
            }
            return null;
          })}
          <div className="flex space-x-2">
            <button
              type="button"
              className="rounded-md bg-blue-500 px-4 py-2 text-white"
              onClick={() => {
                setNewarticle([...(newarticle || []), { type: "text", text: "" }]);
              }}
            >
              テキストを追加
            </button>
            <button
              type="button"
              className="rounded-md bg-green-500 px-4 py-2 text-white"
              onClick={() => {
                setNewarticle([...(newarticle || []), { type: "CoverImage", url: "", width: 0, height: 0 }]);
              }}
            >
              カバーイメージを追加
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-bold">タグ</div>
          <div className="flex flex-wrap gap-x-3.5">
            {checkableCategories && checkableCategories.length > 0 ? (
              checkableCategories.map((c) => (
                <label key={c.id} className="flex space-x-1">
                  <input
                    id={c.id}
                    type="checkbox"
                    checked={c.isSelect}
                    className="mt-0.5 cursor-pointer"
                    onChange={() => switchCategoryState(c.id)}
                  />
                  <span className="cursor-pointer">{c.name}</span>
                </label>
              ))
            ) : (
              <div>選択可能なカテゴリが存在しません。</div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="submit"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-indigo-500 text-white hover:bg-indigo-600",
              "disabled:cursor-not-allowed"
            )}
            disabled={isSubmitting}
          >
            記事を更新
          </button>
          <button
            type="button"
            className={twMerge(
              "rounded-md px-5 py-1 font-bold",
              "bg-red-500 text-white hover:bg-red-600"
            )}
            // onClick={handleDelete}
          >
            削除
          </button>
        </div>
      </form>
    </main>
  );
};

export default Page;
