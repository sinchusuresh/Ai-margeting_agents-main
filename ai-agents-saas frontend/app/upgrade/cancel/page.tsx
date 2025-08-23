"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ArrowLeft, RefreshCw, HelpCircle } from "lucide-react"

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* Cancel Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <Card className="border-0 shadow-2xl bg-white">
              <CardHeader className="text-center pb-8">
                <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                  <RefreshCw className="w-10 h-10 text-yellow-600" />
                </div>
                
                <CardTitle className="text-3xl font-bold text-gray-900 mb-4">
                  Payment Canceled
                </CardTitle>
                
                <CardDescription className="text-lg text-gray-600">
                  No worries! Your payment was canceled and no charges were made to your account. You can try again anytime.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8">
                {/* What Happened */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-yellow-600" />
                    What Happened?
                  </h3>
                  <ul className="space-y-3 text-left text-gray-700">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Your payment was canceled before completion</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>No charges were made to your account</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>You can try the payment process again</span>
                    </li>
                  </ul>
                </div>

                {/* Quick Actions */}
                <div className="space-y-4">
                  <Link href="/upgrade">
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-semibold py-3 rounded-lg transition-all duration-300">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </Link>
                  
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full py-3 rounded-lg">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </Link>
                </div>

                {/* Additional Info */}
                <div className="text-sm text-gray-500 space-y-2">
                  <p>
                    Having trouble with the payment? Our support team is here to help!
                  </p>
                  <p>
                    Contact us at{" "}
                    <a href="mailto:support@aimarketing.com" className="text-purple-600 hover:underline">
                      support@aimarketing.com
                    </a>
                    {" "}or check out our{" "}
                    <Link href="/contact" className="text-purple-600 hover:underline">
                      contact page
                    </Link>
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