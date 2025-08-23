"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Zap, Calendar, Crown, BarChart2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner, LoadingSpinnerInline } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/hooks/use-api";
import { userApi, dashboardApi } from "@/lib/api-services";

export function DashboardContent({ activeTab, profile }: { activeTab: string, profile: any }) {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // API hooks
  const profileApi = useApi(userApi.getProfile);
  const usageApi = useApi(userApi.getUsageStats);
  const statsApi = useApi(dashboardApi.getDashboardStats);

  const refreshData = async () => {
    try {
      // Fetch all data in parallel
      await Promise.all([
        profileApi.execute(),
        usageApi.execute(),
        statsApi.execute()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    refreshData();
    
    // Refetch on tab focus
    const handleFocus = () => refreshData();
    window.addEventListener("focus", handleFocus);
    
    // Refetch every 60 seconds to keep data fresh
    const interval = setInterval(refreshData, 60000);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, []);

  // Update local state when API data changes
  useEffect(() => {
    if (profileApi.data) {
      setUserProfile(profileApi.data);
    }
  }, [profileApi.data]);

  useEffect(() => {
    if (statsApi.data) {
      setDashboardStats(statsApi.data);
    }
  }, [statsApi.data]);

  // Show loading state while fetching initial data
  if (profileApi.loading && !userProfile) {
    return (
      <main className="flex-1 p-6">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </main>
    );
  }

  // Show error state if profile loading failed
  if (profileApi.error && !userProfile) {
    return (
      <main className="flex-1 p-6">
        <EmptyState
          icon={BarChart2}
          title="Failed to load dashboard"
          description={profileApi.error}
          action={
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          }
        />
      </main>
    );
  }

  // Use profile prop as fallback if API data not available
  const currentProfile = userProfile || profile;
  const currentUsage = usageApi.data;
  const currentStats = dashboardStats;

  if (!currentProfile) {
    return (
      <main className="flex-1 p-6">
        <EmptyState
          icon={BarChart2}
          title="No profile data available"
          description="Unable to load your profile information. Please try refreshing the page."
        />
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {currentProfile.firstName || currentProfile.user?.firstName || 'User'}!
            </h2>
            <p className="text-gray-600">Here's your AI marketing dashboard.</p>
          </div>
          <button
            onClick={refreshData}
            disabled={profileApi.loading || usageApi.loading || statsApi.loading}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${(profileApi.loading || usageApi.loading || statsApi.loading) ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Plan Status */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-800">
                {currentProfile.subscription?.plan || currentProfile.user?.subscription?.plan || 'Free Trial'} Plan Active
              </CardTitle>
              <span className="text-green-600">
                {currentProfile.subscription?.plan === "free_trial" || currentProfile.user?.subscription?.plan === "free_trial"
                  ? `${currentProfile.trialDaysRemaining || currentProfile.user?.trialDaysRemaining || 0} days remaining`
                  : "Active subscription"}
              </span>
            </div>
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* User Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageApi.loading ? (
              <LoadingSpinnerInline size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {currentUsage?.totalGenerations || 0}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Generations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usageApi.loading ? (
              <LoadingSpinnerInline size="sm" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {currentUsage?.monthlyGenerations || 0}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentProfile.subscription?.plan || currentProfile.user?.subscription?.plan || 'Free Trial'}
            </div>
            <p className="text-xs text-muted-foreground">Current plan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Days Left</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentProfile.trialDaysRemaining || currentProfile.user?.trialDaysRemaining || '-'}
            </div>
            <p className="text-xs text-muted-foreground">If on trial</p>
          </CardContent>
        </Card>
      </div>

      {/* Available Tools */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Tools</CardTitle>
        </CardHeader>
        <CardContent>
          {profileApi.loading ? (
            <LoadingSpinner text="Loading available tools..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(currentProfile.availableTools || currentProfile.user?.availableTools) && 
               (currentProfile.availableTools?.length > 0 || currentProfile.user?.availableTools?.length > 0) ? (
                (currentProfile.availableTools || currentProfile.user?.availableTools || []).map((tool: string, idx: number) => {
                  // Map tool names to correct slugs
                  let toolSlug = tool.replace(/\s+/g, '-').replace(/_/g, '-').toLowerCase();
                  // Add more mappings if needed
                  return (
                    <Link key={idx} href={`/tools/${toolSlug}`} className="block">
                      <Card className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition">
                        <CardContent className="flex items-center justify-between p-4">
                          <div>
                            <h4 className="font-medium text-green-900 capitalize">{tool.replace(/-/g, ' ')}</h4>
                            <p className="text-sm text-gray-600">AI-powered {tool.replace(/-/g, ' ')}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">Available</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })
              ) : (
                <EmptyState
                  icon={Zap}
                  title="No tools available"
                  description="You don't have access to any AI tools yet. Please upgrade your subscription to get started."
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {profileApi.loading ? (
            <LoadingSpinner text="Loading recent activity..." />
          ) : (
            <>
              {currentProfile.recentActivity && currentProfile.recentActivity.length > 0 ? (
                <ul className="list-disc pl-6">
                  {currentProfile.recentActivity.map((activity: any, idx: number) => (
                    <li key={idx} className="mb-1">
                      <span className="font-medium">{activity.toolName}</span> - {activity.status} at {new Date(activity.createdAt).toLocaleString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  icon={BarChart2}
                  title="No recent activity"
                  description="You haven't used any AI tools yet. Start by trying one of the available tools above."
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
