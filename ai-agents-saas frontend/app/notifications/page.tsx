"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import Link from "next/link"
import { ArrowLeft, Bell, CheckCircle, AlertTriangle, Info, Trash2, BookMarkedIcon as MarkAsUnread } from "lucide-react"

const notifications = [
  {
    id: 1,
    type: "success",
    title: "Welcome to AI Marketing Agents!",
    message: "Your free trial has started. You now have access to 2 powerful AI tools for the next 7 days.",
    time: "2 hours ago",
    read: false,
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: 2,
    type: "warning",
    title: "Trial Ending Soon",
    message: "Your free trial will expire in 5 days. Upgrade now to continue using all AI tools without interruption.",
    time: "1 day ago",
    read: false,
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  {
    id: 3,
    type: "info",
    title: "New Feature: Blog-to-Video Agent",
    message: "Convert your blog posts into engaging video scripts automatically. Available in Pro and Agency plans.",
    time: "3 days ago",
    read: true,
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: 4,
    type: "success",
    title: "SEO Audit Completed",
    message: "Your website audit for example.com has been completed. Score: 78/100. View detailed report now.",
    time: "5 days ago",
    read: true,
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: 5,
    type: "info",
    title: "Monthly Usage Report",
    message:
      "You've used 12 out of your available generations this month. Great progress on your marketing automation!",
    time: "1 week ago",
    read: true,
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
]

export default function NotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications)
  const [filter, setFilter] = useState("all") // all, unread, read

  const unreadCount = notificationList.filter((n) => !n.read).length

  const markAsRead = (id: number) => {
    setNotificationList((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAsUnread = (id: number) => {
    setNotificationList((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: false } : notification)),
    )
  }

  const deleteNotification = (id: number) => {
    setNotificationList((prev) => prev.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const filteredNotifications = notificationList.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "read") return notification.read
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8 text-purple-600" />
                Notifications
                {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>}
              </h1>
              <p className="text-gray-600">Stay updated with your AI marketing activities</p>
            </div>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              Mark All as Read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "all" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-purple-600"
              }`}
              onClick={() => setFilter("all")}
            >
              All ({notificationList.length})
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "unread" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-purple-600"
              }`}
              onClick={() => setFilter("unread")}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === "read" ? "bg-purple-600 text-white" : "text-gray-600 hover:text-purple-600"
              }`}
              onClick={() => setFilter("read")}
            >
              Read ({notificationList.length - unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-600">
                  {filter === "unread" ? "All caught up! No unread notifications." : "No notifications to show."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = notification.icon
              return (
                <Card
                  key={notification.id}
                  className={`transition-all duration-200 hover:shadow-md ${
                    !notification.read ? "ring-2 ring-purple-200 bg-purple-50/30" : "bg-white"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full ${notification.bgColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <IconComponent className={`w-5 h-5 ${notification.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className={`font-semibold ${!notification.read ? "text-gray-900" : "text-gray-700"}`}>
                              {notification.title}
                              {!notification.read && (
                                <span className="w-2 h-2 bg-purple-600 rounded-full inline-block ml-2" />
                              )}
                            </h3>
                            <p className="text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-sm text-gray-500 mt-2">{notification.time}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {!notification.read ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsUnread(notification.id)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <MarkAsUnread className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
