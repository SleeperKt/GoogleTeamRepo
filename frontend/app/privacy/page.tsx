import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FolderKanban } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ProjectHub</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-gray-600">Last updated: December 14, 2024</p>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We collect information you provide directly to us, such as when you create an account, use our
                  services, or contact us for support.
                </p>
                <h3 className="text-lg font-semibold mb-2">Personal Information:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Name and contact information (email address, phone number)</li>
                  <li>Account credentials (username and password)</li>
                  <li>Profile information and preferences</li>
                  <li>Project and task data you create or upload</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
                <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">3. Information Sharing</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except in the
                  following circumstances:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>With your consent or at your direction</li>
                  <li>With service providers who assist us in operating our platform</li>
                  <li>To comply with legal obligations or protect our rights</li>
                  <li>In connection with a merger, acquisition, or sale of assets</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information
                  against unauthorized access, alteration, disclosure, or destruction. However, no method of
                  transmission over the internet or electronic storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as necessary to provide our services, comply with
                  legal obligations, resolve disputes, and enforce our agreements. When we no longer need your
                  information, we will securely delete or anonymize it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Access and receive a copy of your personal information</li>
                  <li>Rectify inaccurate or incomplete information</li>
                  <li>Delete your personal information</li>
                  <li>Restrict or object to processing of your information</li>
                  <li>Data portability</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
                <p className="text-gray-700 leading-relaxed">
                  We use cookies and similar tracking technologies to collect information about your browsing activities
                  and to provide personalized content and advertisements. You can control cookies through your browser
                  settings.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">8. Third-Party Services</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service may contain links to third-party websites or services. We are not responsible for the
                  privacy practices of these third parties. We encourage you to read their privacy policies.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                  information from children under 13. If we become aware that we have collected such information, we
                  will take steps to delete it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">10. Changes to This Policy</h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                  new Privacy Policy on this page and updating the "Last updated" date.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="bg-gray-50 p-4 rounded-lg mt-3">
                  <p className="text-gray-700">
                    <strong>Email:</strong> privacy@projecthub.com
                    <br />
                    <strong>Address:</strong> 123 Business Ave, Suite 100, City, State 12345
                    <br />
                    <strong>Phone:</strong> (555) 123-4567
                  </p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
