'use client';

import React from "react";
import { Bot, TrendingUp, Zap, Shield, Cloud, Settings } from "lucide-react";

const features = [
  {
    category: "AI Tools",
    items: [
      {
        icon: Bot,
        iconClass: "text-3xl text-blue-600",
        title: "Content Generation",
        description: "Generate high-quality blog posts, ad copy, and social media content with advanced AI models.",
      },
      {
        icon: Bot,
        iconClass: "text-3xl text-green-600",
        title: "SEO Audit",
        description: "Analyze your website and get actionable SEO recommendations instantly.",
      },
      {
        icon: Bot,
        iconClass: "text-3xl text-purple-600",
        title: "Email Marketing",
        description: "Create personalized email campaigns that convert, powered by AI insights.",
      },
    ],
  },
  {
    category: "Analytics",
    items: [
      {
        icon: TrendingUp,
        iconClass: "text-3xl text-pink-600",
        title: "Real-Time Analytics",
        description: "Track campaign performance and user engagement with live dashboards.",
      },
      {
        icon: TrendingUp,
        iconClass: "text-3xl text-yellow-600",
        title: "Custom Reports",
        description: "Generate detailed reports tailored to your business needs.",
      },
    ],
  },
  {
    category: "Integrations",
    items: [
      {
        icon: Zap,
        iconClass: "text-3xl text-indigo-600",
        title: "CRM Integration",
        description: "Seamlessly connect with your favorite CRM tools for unified workflows.",
      },
      {
        icon: Cloud,
        iconClass: "text-3xl text-cyan-600",
        title: "Cloud Storage",
        description: "Securely store and access your marketing assets from anywhere.",
      },
    ],
  },
  {
    category: "Security & Automation",
    items: [
      {
        icon: Shield,
        iconClass: "text-3xl text-red-600",
        title: "Enterprise Security",
        description: "Protect your data with industry-leading security and compliance.",
      },
      {
        icon: Settings,
        iconClass: "text-3xl text-gray-600",
        title: "Workflow Automation",
        description: "Automate repetitive marketing tasks and save valuable time.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto py-16 px-4">
        <h1 className="text-5xl font-extrabold mb-6 text-center text-gray-900 drop-shadow-lg">Features</h1>
        <p className="text-xl text-gray-700 mb-14 text-center">
          Discover all the powerful features our AI Marketing Agents platform offers to help you grow your business.
        </p>

        <div className="space-y-16">
          {features.map((section, idx) => (
            <div key={section.category}>
              <h2 className="text-2xl font-bold mb-8 text-blue-700 tracking-wide flex items-center gap-3">
                <span className="inline-block w-2 h-8 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full"></span>
                {section.category}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {section.items.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-8 flex flex-col items-center text-center border border-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300"
                    >
                      <div className="mb-4">
                        <Icon className={`${feature.iconClass} drop-shadow-lg`} />
                      </div>
                      <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  );
                })}
              </div>

              {idx < features.length - 1 && (
                <div className="my-12 flex justify-center">
                  <div className="w-2/3 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full opacity-60"></div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <a
            href="/pricing"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-lg font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
