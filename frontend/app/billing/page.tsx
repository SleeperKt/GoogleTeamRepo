"use client"

import { ArrowLeft, CreditCard, Calendar, CheckCircle, Download, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function BillingPage() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground mt-2">Manage your subscription and payment methods</p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>You are currently on the Pro plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">Pro Plan</h3>
                      <p className="text-muted-foreground">$29.99 / month</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Active</Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Plan Features:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Unlimited projects</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Up to 10 team members</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Advanced reporting</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span>Priority support</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                      <span>
                        Your next billing date is <strong>June 15, 2023</strong>
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">Cancel Subscription</Button>
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white">Upgrade Plan</Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Usage Summary</CardTitle>
                  <CardDescription>Current billing period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Projects</span>
                      <span className="text-sm font-medium">7 / Unlimited</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full w-[35%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Team Members</span>
                      <span className="text-sm font-medium">8 / 10</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full w-[80%]"></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Storage</span>
                      <span className="text-sm font-medium">2.4GB / 10GB</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-600 rounded-full w-[24%]"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your payment methods</CardDescription>
                </div>
                <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Visa ending in 4242</h3>
                      <p className="text-sm text-muted-foreground">Expires 04/2025</p>
                    </div>
                  </div>
                  <Badge>Default</Badge>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center mr-4">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">Mastercard ending in 5678</h3>
                      <p className="text-sm text-muted-foreground">Expires 08/2024</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Set as Default
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Invoice #INV-2023-005</h3>
                    <p className="text-sm text-muted-foreground">May 15, 2023 • $29.99</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Invoice #INV-2023-004</h3>
                    <p className="text-sm text-muted-foreground">April 15, 2023 • $29.99</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Invoice #INV-2023-003</h3>
                    <p className="text-sm text-muted-foreground">March 15, 2023 • $29.99</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Invoice #INV-2023-002</h3>
                    <p className="text-sm text-muted-foreground">February 15, 2023 • $29.99</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="border rounded-md p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Invoice #INV-2023-001</h3>
                    <p className="text-sm text-muted-foreground">January 15, 2023 • $29.99</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
