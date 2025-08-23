"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  Search,
  Share2,
  PenTool,
  Mail,
  BarChart3,
  Megaphone,
  Layout,
  TrendingUp,
  Users,
  Video,
  Rocket,
  Play,
  MapPin,
  Settings,
  CreditCard,
} from "lucide-react"

interface DashboardSidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const menuItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "seo-audit", label: "SEO Audit Tool", icon: Search, free: true },
  { id: "social-media", label: "Social Media Generator", icon: Share2, free: true },
  { id: "blog-writing", label: "Blog Writing", icon: PenTool, premium: true },
  { id: "email-marketing", label: "Email Marketing", icon: Mail, premium: true },
  { id: "client-reporting", label: "Client Reporting", icon: BarChart3, premium: true },
  { id: "ad-copy", label: "Ad Copy Generator", icon: Megaphone, premium: true },
  { id: "landing-page", label: "Landing Page Builder", icon: Layout, premium: true },
  { id: "competitor-analysis", label: "Competitor Analysis", icon: TrendingUp, premium: true },
  { id: "cold-outreach", label: "Cold Outreach", icon: Users, premium: true },
  { id: "reels-scripts", label: "Reels/Shorts Scripts", icon: Video, premium: true },
  { id: "product-launch", label: "Product Launch", icon: Rocket, premium: true },
  { id: "blog-to-video", label: "Blog-to-Video", icon: Play, premium: true },
  { id: "local-seo", label: "Local SEO Booster", icon: MapPin, premium: true },
]

const bottomMenuItems = [
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "settings", label: "Settings", icon: Settings },
]

export function DashboardSidebar({ activeTab, setActiveTab }: DashboardSidebarProps) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-y-auto">
      <div className="p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon
            const isActive = activeTab === item.id
            const isPremium = item.premium && !item.free

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start text-left ${
                  isPremium ? "opacity-60" : ""
                } ${isActive ? "bg-purple-50 text-purple-700" : ""}`}
                onClick={() => setActiveTab(item.id)}
                disabled={isPremium}
              >
                <IconComponent className="mr-3 h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {item.free && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Free
                  </Badge>
                )}
                {isPremium && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                    Pro
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <nav className="space-y-2">
            {bottomMenuItems.map((item) => {
              const IconComponent = item.icon
              const isActive = activeTab === item.id

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start text-left ${isActive ? "bg-purple-50 text-purple-700" : ""}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <IconComponent className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
