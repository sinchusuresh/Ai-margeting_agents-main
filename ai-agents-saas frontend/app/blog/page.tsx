import React from "react";
import Link from "next/link";
import posts from "./posts.json";

export default function BlogPage() {
  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Blog</h1>
      <p className="text-lg text-gray-600 mb-12 text-center">
        Welcome to our blog! Here you'll find the latest updates, tips, and insights about AI Marketing Agents and digital marketing.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 flex flex-col">
            <img src={post.image} alt={post.title} className="w-full h-40 object-cover rounded mb-4" />
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <span>{new Date(post.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>By {post.author}</span>
            </div>
            <div className="flex gap-2 mb-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{tag}</span>
              ))}
            </div>
            <p className="text-gray-700 mb-4 flex-1">{post.summary}</p>
            <Link href={`/blog/${post.slug}`} className="mt-auto text-blue-600 font-semibold hover:underline">Read More →</Link>
          </div>
        ))}
      </div>
    </div>
  );
} 