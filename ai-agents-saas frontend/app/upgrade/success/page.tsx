"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, ArrowRight, Sparkles, Zap } from "lucide-react"

export default function SuccessPage() {
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sessionId = searchParams.get("session_id")
    
    if (sessionId) {
      // You could fetch subscription details here if needed
      setLoading(false)
    } else {
      // No session ID, redirect to upgrade page
      router.push("/upgrade")
    }
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* Success Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-0 shadow-2xl bg-white">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Successful! 🎉
                </CardTitle>
                
                <CardDescription className="text-lg text-gray-600">
                  Welcome to your new subscription! Your account has been upgraded and you now have access to all the premium features.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* What's Next */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    What's Next?
                  </h3>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Access all 13 AI marketing tools</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Unlimited generations and exports</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Priority support and advanced analytics</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span>Team collaboration features</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <Link href="/dashboard">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-300">
                      <Zap className="w-4 h-4 mr-2" />
                      Go to Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  
                  <Link href="/tools">
                    <Button variant="outline" className="w-full py-3 rounded-lg">
                      Explore AI Tools
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    You'll receive a confirmation email shortly with your subscription details.
                  </p>
                  <p>
                    Need help? Contact our support team at{" "}
                    <a href="mailto:support@aimarketing.com" className="text-purple-600 hover:underline">
                      support@aimarketing.com
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
} 