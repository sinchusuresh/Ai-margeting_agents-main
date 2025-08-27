"use client";
import { useEffect, useState } from "react";
import { ProfileContent } from "@/components/profile-content";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [profileRes, usageRes] = await Promise.all([
          fetch("http://localhost:5000/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/users/usage-stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Check if responses are ok before parsing JSON
        if (!profileRes.ok) {
          throw new Error(`Profile request failed: ${profileRes.status} ${profileRes.statusText}`);
        }
        if (!usageRes.ok) {
          throw new Error(`Usage stats request failed: ${usageRes.status} ${usageRes.statusText}`);
        }

        const profileData = await profileRes.json();
        const usageData = await usageRes.json();
        
        setProfile({
          ...profileData.user,
          usage: usageData,
        });
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // Set a basic profile structure if API calls fail
        setProfile({
          firstName: 'User',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          subscription: { plan: 'free_trial', status: 'trial' },
          usage: { totalGenerations: 0, monthlyGenerations: 0 }
        });
      }
    };
    fetchData();
  }, []);

  if (!profile) return <div>Loading...</div>;

  return <ProfileContent profile={profile} />;
}
