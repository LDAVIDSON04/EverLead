"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const TRUNCATE_LENGTH = 200;

/** Canonical public agent profile (no tab nav). Use this for all agent name links. */
const AGENT_PROFILE_PATH = "/agentportfolio";

export type PostWithAuthor = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author: {
    full_name: string | null;
    job_title: string | null;
    funeral_home: string | null;
    profile_picture_url: string | null;
    role?: string | null;
    agent_city?: string | null;
    agent_province?: string | null;
  } | null;
};

export function BlogPostCard({ post }: { post: PostWithAuthor }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (post.body?.length ?? 0) > TRUNCATE_LENGTH;
  const displayBody = expanded || !isLong ? post.body : post.body.slice(0, TRUNCATE_LENGTH);
  const isAdmin = post.author?.role === "admin";

  return (
    <li className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
      <article className="p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          {isAdmin ? (
            <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 flex-shrink-0 flex items-center justify-center">
              <Image src="/Soradin.png" alt="Soradin" width={48} height={48} className="w-12 h-12 object-contain" />
            </div>
          ) : post.author?.profile_picture_url ? (
            <img
              src={post.author.profile_picture_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-neutral-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-lg font-medium">
              {(post.author?.full_name || "?")[0].toUpperCase()}
            </div>
          )}
          <div>
            {isAdmin ? (
              <p className="font-medium text-neutral-900">Soradin</p>
            ) : (
              <Link
                href={`${AGENT_PROFILE_PATH}/${post.author_id}`}
                className="font-medium text-neutral-900 hover:text-blue-600 hover:underline"
              >
                {post.author?.full_name ?? "Author"}
              </Link>
            )}
            {!isAdmin && (
              <p className="text-sm text-black">
                {[
                  post.author?.job_title,
                  post.author?.funeral_home,
                  [post.author?.agent_city, post.author?.agent_province].filter(Boolean).join(", "),
                ].filter(Boolean).join(" · ") || "—"}
              </p>
            )}
          </div>
        </div>
        <div className="text-black whitespace-pre-wrap text-sm leading-relaxed">
          {displayBody}
          {isLong && !expanded && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-neutral-500 font-medium hover:underline"
              >
                ...see more
              </button>
            </>
          )}
          {isLong && expanded && (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="text-neutral-500 font-medium hover:underline"
              >
                see less
              </button>
            </>
          )}
        </div>
        {post.image_url && (
          <div className="mt-4 rounded-lg overflow-hidden border border-neutral-200">
            <img
              src={post.image_url}
              alt=""
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
        <p className="text-neutral-400 text-xs mt-4">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </article>
    </li>
  );
}
