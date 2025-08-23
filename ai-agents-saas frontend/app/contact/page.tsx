"use client";
import React, { useState } from "react";
import { Mail, Phone, MapPin, User } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:5000/api/user/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setForm({ name: "", email: "", message: "" }); // Clear form
        console.log('✅ Contact form submitted successfully');
      } else {
        setError(data.message || "Failed to send message");
        console.error('❌ Contact form error:', data.message);
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
      console.error('❌ Contact form network error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-0">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center py-12 mb-8">
        <div className="bg-blue-600 rounded-full p-4 mb-4 shadow-lg">
          <Mail className="text-white text-4xl" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Contact Us</h1>
        <p className="text-lg text-gray-600 text-center max-w-xl">
          Have questions or need support? Our team is here to help you succeed with AI Marketing Agents.
        </p>
      </div>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 px-4">
        {/* Contact Form Card */}
        <div className="backdrop-blur-md bg-white/80 rounded-2xl shadow-2xl p-8 flex flex-col justify-center border border-blue-100 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-blue-700">Send Us a Message</h2>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <User className="absolute left-3 top-3 text-blue-400" />
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Your Name"
                required
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-blue-400" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Your Email"
                required
              />
            </div>
            <div className="relative">
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-lg pl-3 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                placeholder="Your Message"
                rows={5}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitted || isLoading}
            >
              {isLoading ? "Sending..." : submitted ? "Message Sent!" : "Send Message"}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {submitted && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                Thank you for your message! We'll get back to you soon.
              </div>
            )}
          </form>
        </div>
        {/* Contact Info & Map */}
        <div className="flex flex-col gap-8 justify-center animate-fade-in">
          <div className="bg-white/80 rounded-2xl shadow p-6 border border-blue-100">
            <h2 className="text-2xl font-bold mb-4 text-blue-700">Contact Information</h2>
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="text-blue-500" />
              <span>Thind Market, Jhankat, Khatima, Udham Singh Nagar, 262308, Uttarakhand</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="text-blue-500" />
              <a href="mailto:sumit786rana@gmail.com" className="text-blue-700 underline">sumit786rana@gmail.com</a>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="text-blue-500" />
              <a href="tel:+917500893874" className="text-blue-700 underline">+91 7500893874</a>
            </div>
          </div>
          <div className="bg-white/80 rounded-2xl shadow p-4 border border-blue-100">
            <h2 className="text-xl font-semibold mb-3 text-blue-700">Our Location</h2>
            <div className="w-full h-48 rounded-lg overflow-hidden shadow">
              <iframe
                title="Our Location"
                src="https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=Khatima,Uttarakhand,India"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 