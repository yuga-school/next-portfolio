"use client";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFish } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";
import { useAuth } from "@/app/_hooks/useAuth";
import { useRouter } from "next/navigation";

const Header: React.FC = () => {
  const router = useRouter();
  const { isLoading, session } = useAuth();
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <header>
      <div className="bg-slate-800 py-2">
        <div
          className={twMerge(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <div>
            <Link href="/">
              <FontAwesomeIcon icon={faFish} className="mr-1" />
              Portfolio
            </Link>
          </div>
          <div className="flex gap-x-6">
            {!isLoading &&
              (session ? (
                <button onClick={logout}>Logout</button>
              ) : (
                <Link href="/login">Login</Link>
              ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;