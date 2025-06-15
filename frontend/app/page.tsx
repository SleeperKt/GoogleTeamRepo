import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderKanban, Users, BarChart3, Calendar, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">ProjectHub</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-600 hover:text-gray-900 scroll-smooth">
              Features
            </Link>
            <Link href="#pricing" className="text-gray-600 hover:text-gray-900 scroll-smooth">
              Pricing
            </Link>
            <Link href="#about" className="text-gray-600 hover:text-gray-900 scroll-smooth">
              About
            </Link>
          </nav>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Manage Projects
            <span className="text-violet-600 block">Like a Pro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Streamline your workflow, collaborate with your team, and deliver projects on time with our powerful project
            management platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help teams collaborate and deliver exceptional results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <FolderKanban className="w-12 h-12 text-violet-600 mx-auto mb-4" />
                <CardTitle>Task Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create, assign, and track tasks with ease. Keep your team organized and productive.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Team Collaboration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Work together seamlessly with real-time updates, comments, and file sharing.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get insights into your team's performance with detailed analytics and reports.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="w-12 h-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Timeline Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Plan and visualize project timelines to ensure deadlines are met.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that's right for your team. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$0</div>
                <p className="text-gray-600">per month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <FolderKanban className="w-5 h-5 text-green-600 mr-3" />
                    Up to 3 projects
                  </li>
                  <li className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-3" />
                    Up to 5 team members
                  </li>
                  <li className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                    Basic reporting
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-violet-200 shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">$12</div>
                <p className="text-gray-600">per user/month</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <FolderKanban className="w-5 h-5 text-green-600 mr-3" />
                    Unlimited projects
                  </li>
                  <li className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-3" />
                    Unlimited team members
                  </li>
                  <li className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                    Advanced analytics
                  </li>
                  <li className="flex items-center">
                    <Calendar className="w-5 h-5 text-green-600 mr-3" />
                    Timeline & Gantt charts
                  </li>
                </ul>
                <Button className="w-full mt-6">Start Pro Trial</Button>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Enterprise</CardTitle>
                <div className="text-4xl font-bold text-gray-900 mt-4">Custom</div>
                <p className="text-gray-600">pricing</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <FolderKanban className="w-5 h-5 text-green-600 mr-3" />
                    Everything in Pro
                  </li>
                  <li className="flex items-center">
                    <Users className="w-5 h-5 text-green-600 mr-3" />
                    Advanced security
                  </li>
                  <li className="flex items-center">
                    <BarChart3 className="w-5 h-5 text-green-600 mr-3" />
                    Custom integrations
                  </li>
                  <li className="flex items-center">
                    <Calendar className="w-5 h-5 text-green-600 mr-3" />
                    Dedicated support
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline">
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">About ProjectHub</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're passionate about helping teams work better together. Our mission is to provide the tools and
              insights that make project management effortless and effective.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h3>
              <p className="text-gray-600 mb-6">
                Founded in 2024, ProjectHub was born from the frustration of managing complex projects with scattered
                tools and unclear processes. We believe that great work happens when teams have clarity, focus, and the
                right tools to collaborate effectively.
              </p>
              <p className="text-gray-600 mb-6">
                Today, we serve thousands of teams worldwide, from startups to enterprise organizations, helping them
                deliver projects on time and exceed their goals.
              </p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-violet-600">10K+</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-600">50K+</div>
                  <div className="text-sm text-gray-600">Projects Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-600">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Choose ProjectHub?</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <FolderKanban className="w-6 h-6 text-violet-600 mr-3 mt-1" />
                  <div>
                    <div className="font-semibold">Intuitive Design</div>
                    <div className="text-gray-600 text-sm">Easy to learn, powerful to use</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <Users className="w-6 h-6 text-violet-600 mr-3 mt-1" />
                  <div>
                    <div className="font-semibold">Team-First Approach</div>
                    <div className="text-gray-600 text-sm">Built for collaboration and transparency</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <BarChart3 className="w-6 h-6 text-violet-600 mr-3 mt-1" />
                  <div>
                    <div className="font-semibold">Data-Driven Insights</div>
                    <div className="text-gray-600 text-sm">Make informed decisions with real-time analytics</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-violet-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-xl text-violet-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams who trust ProjectHub to manage their projects and deliver results.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">ProjectHub</span>
            </div>
            <div className="flex space-x-6 text-gray-400">
              <Link href="#" className="hover:text-white">
                Privacy
              </Link>
              <Link href="#" className="hover:text-white">
                Terms
              </Link>
              <Link href="#" className="hover:text-white">
                Support
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ProjectHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
