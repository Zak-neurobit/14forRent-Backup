import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronRight } from "lucide-react"; // Added for subtle visual cue

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-[#1A2953] to-[#2A3F70] text-white py-16">
          <div className="forrent-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">14 For Rent, LLC — Terms and Conditions</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Effective Date: August 2024 &bull; Last Updated: January 2025
              <br />
              These Terms and Conditions ("Terms") govern your use of the services provided by 14 For Rent, LLC ("Company," "we," "our," or "us"). By submitting a listing, requesting leasing help, or using our platform, you ("Client," "Owner," or "User") agree to these Terms.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="forrent-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100 space-y-8">

              {/* 1. Service Scope */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  1. Service Scope <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  14 For Rent, LLC provides marketing, lead generation, showing coordination, and leasing assistance for residential rental properties.
                </p>
                <p className="text-gray-700 leading-relaxed font-semibold mb-2">We do not provide:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>Legal advice</li>
                  <li>Full-service property management</li>
                  <li>Financial or tax consultation</li>
                  <li>Tenant screening or lease execution unless agreed to in writing</li>
                </ul>
              </div>

              {/* 2. Independent Contractor Relationship */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  2. Independent Contractor Relationship <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  14 For Rent, LLC operates as an independent contractor. No agency, joint venture, or employment relationship is created by your use of our services.
                </p>
              </div>

              {/* 3. Liability Limitation */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  3. Liability Limitation <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  To the fullest extent permitted by law, 14 For Rent, LLC shall not be liable for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>Conduct or background of tenants or applicants</li>
                  <li>Property damage, loss of rental income, or legal disputes</li>
                  <li>Fair Housing violations by landlords or third parties</li>
                  <li>Delays or miscommunications during leasing coordination</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  All leasing decisions and tenant approvals are the sole responsibility of the property owner or manager.
                </p>
              </div>

              {/* 4. Indemnification */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  4. Indemnification <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Client agrees to indemnify and hold harmless 14 For Rent, LLC and its affiliates from any claims or liabilities arising from:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>Tenant complaints or legal actions</li>
                  <li>Fair Housing or lease-related violations</li>
                  <li>Misrepresentations by the Client</li>
                </ul>
              </div>

              {/* 5. Fair Housing Compliance */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  5. Fair Housing Compliance <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We strictly follow all local, state, and federal Fair Housing laws. Landlords are solely responsible for ensuring their compliance in communications and rental decisions.
                </p>
              </div>

              {/* 6. Payment Terms */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  6. Payment Terms <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All leasing commissions are due upon tenant move-in unless otherwise stated in writing. Late payments may incur fees or legal enforcement.
                </p>
              </div>

              {/* 7. Intellectual Property */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  7. Intellectual Property <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  All content created by 14 For Rent, LLC—including photos, descriptions, and marketing—is our intellectual property and may not be reused without permission.
                </p>
              </div>

              {/* 8. Disclaimer of Warranties */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  8. Disclaimer of Warranties <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Services are provided "as-is" without warranties of any kind. We do not guarantee leasing timelines or tenant quality.
                </p>
              </div>

              {/* 9. Governing Law & Dispute Resolution */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  9. Governing Law & Dispute Resolution <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  This agreement is governed by California law. Disputes must be resolved by binding arbitration in Los Angeles County, unless prohibited by law.
                </p>
              </div>

              {/* 10. Changes to Terms */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  10. Changes to Terms <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We may update these Terms at any time. Continued use of our services after updates indicates your acceptance of the revised Terms.
                </p>
              </div>

              {/* 11. Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  11. Contact Information <ChevronRight size={20} className="ml-2 text-gray-400" />
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  14 For Rent, LLC<br />
                  Los Angeles, CA 90048<br />
                  323-774-4700<br />
                  Email: <a href="mailto:info@14forrent.com" className="text-[#1A2953] hover:underline">info@14forrent.com</a>
                </p>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TermsAndConditions;