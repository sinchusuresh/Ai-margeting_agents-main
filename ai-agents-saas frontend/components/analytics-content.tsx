"use client";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi } from "@/hooks/use-api";
import { analyticsApi } from "@/lib/api-services";
import { BarChart2, TrendingUp, Clock, Zap } from "lucide-react";

export function AnalyticsContent({ analytics }: { analytics: any }) {
  const analyticsApiHook = useApi(analyticsApi.getAnalytics);

  useEffect(() => {
    analyticsApiHook.execute();
  }, []);

  // Show loading state while fetching data
  if (analyticsApiHook.loading && !analyticsApiHook.data) {
    return (
      <div className="p-8">
        <LoadingSpinner size="lg" text="Loading analytics data..." />
      </div>
    );
  }

  // Show error state if loading failed
  if (analyticsApiHook.error && !analyticsApiHook.data) {
    return (
      <div className="p-8">
        <EmptyState
          icon={BarChart2}
          title="Failed to load analytics"
          description={analyticsApiHook.error}
          action={
            <button
              onClick={() => analyticsApiHook.execute()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Try Again
            </button>
          }
        />
      </div>
    );
  }

  // Use API data or fallback to prop data
  const currentAnalytics = analyticsApiHook.data || analytics;

  if (!currentAnalytics) {
    return (
      <div className="p-8">
        <EmptyState
          icon={BarChart2}
          title="No analytics data available"
          description="Unable to load analytics information. Please try refreshing the page."
        />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Generations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentAnalytics.totalGenerations || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentAnalytics.uptime !== null && currentAnalytics.uptime !== undefined 
                ? `${currentAnalytics.uptime}%` 
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {currentAnalytics.avgResponseTime !== null && currentAnalytics.avgResponseTime !== undefined 
                ? `${currentAnalytics.avgResponseTime}s` 
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Most Popular Tools</h2>
        
        {currentAnalytics.mostPopularTools && currentAnalytics.mostPopularTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentAnalytics.mostPopularTools.map((tool: any, idx: number) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {tool.uses}
                  </div>
                  <p className="text-sm text-muted-foreground">total uses</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No tool usage data"
            description="No tools have been used yet. Start using AI tools to see analytics here."
          />
        )}
      </div>
      
      {/* Additional analytics sections can be added here */}
      {currentAnalytics.dailyUsage && currentAnalytics.dailyUsage.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Daily Usage (Last 30 Days)</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {currentAnalytics.dailyUsage.map((day: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{day._id}</span>
                    <span className="text-primary font-semibold">{day.count} uses</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 