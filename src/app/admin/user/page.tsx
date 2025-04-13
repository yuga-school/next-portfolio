"use client";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { supabase } from "@/utils/supabase";
import Image from "next/image";
import CryptoJS from "crypto-js";

type Link = {
  url: string;
  icon: string;
};

type User = {
  name: string;
  country: string;
  age: string;
  affiliation: string;
  links: Link[];
};

const calculateMD5Hash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(buffer);
  return CryptoJS.MD5(wordArray).toString();
  
};

const Page: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [user1, setUser1] = useState<User[] | null>(null);
  const router = useRouter();
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/user", {
          method: "GET",
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("ユーザー情報の取得に失敗しました");
        }
        const userData: User[] = await response.json();
        setUser(userData[0]);
        setIsInitialized(true);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "予期せぬエラーが発生しました";
        console.error(errorMsg);
        setFetchErrorMsg(errorMsg);
      }
    };

    fetchUser();
  }, []);

  // アイコン画像をアップロード
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileHash = await calculateMD5Hash(file);
    const path = `private/${fileHash}`;
    const { data, error } = await supabase.storage
      .from("cover_image")
      .upload(path, file, { upsert: true });
  
    if (error || !data) {
      window.alert(`アップロードに失敗: ${error.message}`);
      return;
    }
  
    const publicUrlResult = supabase.storage.from("cover_image").getPublicUrl(data.path);
    const newUrl = publicUrlResult.data.publicUrl;
  
    setUser((prev) => {
      if (!prev) return prev;
      const updatedLinks = prev.links.map((item, i) => {
        if (i === index) {
          return { ...item, icon: newUrl }; // 👈 iconに設定
        }
        return item;
      });
      return { ...prev, links: updatedLinks };
    });
  };
  

  // リンク情報を編集
  const handleLinkChange = (index: number, field: keyof Link, value: string) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedLinks = [...prev.links];
      updatedLinks[index][field] = value;
      return { ...prev, links: updatedLinks };
    });
  };

  // リンクを追加
  const handleAddLink = () => {
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        links: [...prev.links, { url: "", icon: "" }],
      };
    });
  };

  // リンクを削除
  const handleRemoveLink = (index: number) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updatedLinks = prev.links.filter((_, i) => i !== index);
      return { ...prev, links: updatedLinks };
    });
  };

  // ユーザー情報を更新
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/admin/users/1a2835f4-ada9-4a64-86e2-df3fc30a9b2d", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        throw new Error("ユーザー情報の更新に失敗しました");
      }

      window.alert("ユーザー情報を更新しました");
      router.push("/");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "予期せぬエラーが発生しました";
      console.error(errorMsg);
      window.alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (fetchErrorMsg) {
    return <div className="text-red-500">{fetchErrorMsg}</div>;
  }

  if (!isInitialized || !user) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main className="p-4">
      <h1 className="mb-4 font-bold text-2xl">ユーザー情報の編集</h1>
      <form onSubmit={handleSubmit} className={twMerge("space-y-4", isSubmitting && "opacity-50")}>
        <div>
          <label className="block font-bold">名前</label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            className="w-full rounded-md border-2 px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-bold">国</label>
          <input
            type="text"
            value={user.country}
            onChange={(e) => setUser({ ...user, country: e.target.value })}
            className="w-full rounded-md border-2 px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-bold">年齢</label>
          <input
            type="text"
            value={user.age}
            onChange={(e) => setUser({ ...user, age: e.target.value })}
            className="w-full rounded-md border-2 px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-bold">所属</label>
          <input
            type="text"
            value={user.affiliation}
            onChange={(e) => setUser({ ...user, affiliation: e.target.value })}
            className="w-full rounded-md border-2 px-2 py-1"
          />
        </div>
        <div>
          <label className="block font-bold">リンク</label>
          {user.links?.map((link, index) => (
            <div key={index} className="mb-4 space-y-2">
              <div>
                <label className="block font-bold">URL</label>
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, "url", e.target.value)}
                  className="w-full rounded-md border-2 px-2 py-1"
                />
              </div>
              <div>
                <label className="block font-bold">アイコンURL</label>
                <input
                    type="text"
                    value={link.icon}
                    onChange={(e) => handleLinkChange(index, "icon", e.target.value)}
                    className="w-full rounded-md border-2 px-2 py-1"
                />
                </div>
                <div>
                <label className="block font-bold">画像アップロード</label>
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
                {link.icon && (
                    <div className="mt-2">
                    <Image
                        src={
                        link.icon.startsWith("/") || link.icon.startsWith("http")
                            ? link.icon
                            : `/${link.icon}`
                        }
                        alt="プレビュー画像"
                        width={100}
                        height={100}
                        className="border-2 border-gray-300"
                    />
                    </div>
                )}
                </div>
              <button
                type="button"
                className="mt-2 rounded-md bg-red-500 px-4 py-2 text-white"
                onClick={() => handleRemoveLink(index)}
              >
                削除
              </button>
            </div>
          ))}
          <button
            type="button"
            className="rounded-md bg-green-500 px-4 py-2 text-white"
            onClick={handleAddLink}
          >
            リンクを追加
          </button>
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-500 px-4 py-2 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? "更新中..." : "更新"}
        </button>
      </form>
    </main>
  );
};

export default Page;