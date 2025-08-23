"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          // No token found, redirect to login
          window.location.href = '/auth/login';
          return;
        }
        
        const profileRes = await fetch("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Check if response is ok before parsing JSON
        if (!profileRes.ok) {
          throw new Error(`Profile request failed: ${profileRes.status} ${profileRes.statusText}`);
        }

        const profileData = await profileRes.json();
        setProfile({
          ...profileData.user,
          recentActivity: profileData.recentActivity || [],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        
        // Check if it's an authentication error
        if (error instanceof Error && error.message.includes('401')) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
          return;
        }
        
        // Set a basic profile structure if API calls fail
        setProfile({
          firstName: 'User',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          subscription: { plan: 'free_trial', status: 'trial' },
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Refresh data when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for profile updates from child components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lastProfileUpdate') {
        fetchData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Also check for localStorage changes in the same window
    const checkForUpdates = () => {
      const lastUpdate = localStorage.getItem('lastProfileUpdate');
      if (lastUpdate && parseInt(lastUpdate) > Date.now() - 10000) {
        fetchData();
      }
    };
    const updateInterval = setInterval(checkForUpdates, 5000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(updateInterval);
    };
  }, []);

  if (loading || !profile) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <>
      <DashboardHeader />
      <DashboardContent activeTab="overview" profile={profile} />
    </>
  );
}
