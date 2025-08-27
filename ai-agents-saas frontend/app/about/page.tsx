import React from "react";
import { Users } from "lucide-react";

const team = [
  {
    name: "Amit Sharma",
    role: "Founder & CEO",
    bio: "Amit leads the vision and strategy for AI Marketing Agents, with 10+ years in AI and SaaS.",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Priya Patel",
    role: "Chief Technology Officer",
    bio: "Priya heads our engineering team, building scalable and innovative AI solutions.",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "John Lee",
    role: "Head of Product",
    bio: "John ensures our platform delivers real value to marketers worldwide.",
    img: "https://randomuser.me/api/portraits/men/65.jpg",
  },
];

const milestones = [
  { year: 2022, event: "Company founded and vision established." },
  { year: 2023, event: "Launched MVP with core AI tools." },
  { year: 2024, event: "Reached 1,000+ customers and expanded feature set." },
  { year: 2025, event: "Introduced advanced analytics and integrations." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 pb-16">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-16 mb-10 animate-fade-in">
        <div className="bg-blue-600 rounded-full p-6 mb-6 shadow-lg">
          <Users className="text-white text-5xl" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4 text-center drop-shadow">About Us</h1>
        <p className="text-xl text-gray-700 text-center max-w-2xl mb-2">
          Empowering marketers with intelligent, easy-to-use AI tools that drive real business results.
        </p>
        <p className="text-lg text-blue-700 text-center max-w-xl font-medium">
          To be the world’s most trusted platform for AI-driven marketing innovation.
        </p>
      </div>
      {/* Values Section */}
      <section className="mb-12 text-center animate-fade-in">
        <h2 className="text-2xl font-semibold mb-2 text-blue-700">Our Values</h2>
        <ul className="flex flex-wrap justify-center gap-6 text-gray-600 mb-8">
          <li className="bg-white/80 rounded-lg px-6 py-3 shadow font-semibold text-lg hover:scale-105 transition">Innovation</li>
          <li className="bg-white/80 rounded-lg px-6 py-3 shadow font-semibold text-lg hover:scale-105 transition">Customer Success</li>
          <li className="bg-white/80 rounded-lg px-6 py-3 shadow font-semibold text-lg hover:scale-105 transition">Transparency</li>
          <li className="bg-white/80 rounded-lg px-6 py-3 shadow font-semibold text-lg hover:scale-105 transition">Integrity</li>
        </ul>
      </section>
      {/* Team Section */}
      <section className="mb-16 animate-fade-in">
        <h2 className="text-3xl font-bold mb-8 text-center text-blue-700">Meet the Team</h2>
        <div className="flex flex-wrap justify-center gap-10">
          {team.map((member) => (
            <div key={member.name} className="bg-white/90 rounded-2xl shadow-xl p-8 w-72 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all duration-200">
              <img src={member.img} alt={member.name} className="w-24 h-24 rounded-full mb-4 object-cover border-4 border-blue-100 shadow" />
              <h3 className="text-xl font-bold mb-1 text-gray-900">{member.name}</h3>
              <p className="text-blue-700 font-semibold mb-1">{member.role}</p>
              <p className="text-gray-600 text-center text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Milestones Section */}
      <section className="animate-fade-in">
        <h2 className="text-2xl font-semibold mb-6 text-center text-blue-700">Our Journey</h2>
        <ol className="border-l-4 border-blue-600 pl-6 max-w-2xl mx-auto">
          {milestones.map((m) => (
            <li key={m.year} className="mb-6">
              <div className="text-blue-600 font-bold text-lg">{m.year}</div>
              <div className="text-gray-700 text-base">{m.event}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
} 