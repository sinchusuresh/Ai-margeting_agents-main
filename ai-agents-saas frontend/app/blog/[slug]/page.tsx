import React from "react";
import posts from "../posts.json";
import { notFound } from "next/navigation";

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return notFound();
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <img src={post.image} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6" />
      <h1 className="text-4xl font-bold mb-2">{post.title}</h1>
      <div className="flex items-center gap-4 mb-4 text-gray-500">
        <span>By {post.author}</span>
        <span>•</span>
        <span>{new Date(post.date).toLocaleDateString()}</span>
        <span>•</span>
        <span className="flex gap-2">{post.tags.map((tag: string) => <span key={tag} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">{tag}</span>)}</span>
      </div>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
} 