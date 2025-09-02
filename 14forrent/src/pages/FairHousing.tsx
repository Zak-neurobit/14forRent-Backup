import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, ChevronRight, Mail, Phone, MapPin, CheckCircle2 } from "lucide-react"; // Added relevant icons

const FairHousing = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-gradient-to-r from-[#1A2953] to-[#2A3F70] text-white py-16">
          <div className="forrent-container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Fair Housing Statement</h1>
            <p className="text-xl max-w-3xl mx-auto">
              At 14 For Rent, LLC, we are fully committed to Fair Housing compliance and uphold the principles of equal opportunity housing in accordance with all federal, state, and local laws.
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="forrent-container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg border border-gray-100 space-y-8">

              {/* Our Commitment */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Scale size={24} className="mr-3 text-[#1A2953]" /> Our Commitment to Fair Housing
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  At 14 For Rent, LLC, we are fully committed to Fair Housing compliance and uphold the principles of equal opportunity housing in accordance with all federal, state, and local laws. We believe that everyone deserves equal access to housing opportunities, free from discrimination. Our platform is designed to connect individuals with homes without regard to their protected characteristics.
                </p>
              </div>

              {/* We strictly comply with: */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <CheckCircle2 size={24} className="mr-3 text-green-600" /> We strictly comply with:
                </h2>
                <p className="text-gray-700 leading-relaxed font-semibold mb-3">
                  The Federal Fair Housing Act (Title VIII of the Civil Rights Act of 1968, as amended), which prohibits discrimination based on:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 mb-6">
                  <li>Race</li>
                  <li>Color</li>
                  <li>Religion</li>
                  <li>Sex</li>
                  <li>Disability</li>
                  <li>Familial Status (presence of children under 18)</li>
                  <li>National Origin</li>
                </ul>

                <p className="text-gray-700 leading-relaxed font-semibold mb-3">
                  The California Fair Employment and Housing Act (FEHA), which further prohibits discrimination based on:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 mb-6">
                  <li>Sexual Orientation</li>
                  <li>Gender Identity and Gender Expression</li>
                  <li>Marital Status</li>
                  <li>Source of Income (including housing subsidies like Section 8)</li>
                  <li>Ancestry</li>
                  <li>Genetic Information</li>
                  <li>Age</li>
                  <li>Citizenship</li>
                  <li>Military or Veteran Status</li>
                </ul>

                <p className="text-gray-700 leading-relaxed font-semibold mb-3">
                  Los Angeles Municipal Codes and Local Ordinances, including protections for:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>Domestic violence survivors</li>
                  <li>Occupation or employment status (where applicable)</li>
                  <li>Arbitrary or unspecified reasons that result in unequal treatment</li>
                </ul>
              </div>

              {/* What We Do NOT Tolerate: */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Scale size={24} className="mr-3 text-red-600" /> What We Do NOT Tolerate:
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  We do not tolerate any form of discrimination, harassment, or retaliation related to housing. This applies to:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>The rental or leasing of units</li>
                  <li>Marketing and advertising</li>
                  <li>Application screening processes</li>
                  <li>Setting rental terms and conditions</li>
                  <li>Occupancy rules</li>
                  <li>Evictions or termination of tenancy</li>
                </ul>
              </div>

              {/* Language Accessibility */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <ChevronRight size={20} className="ml-2 text-gray-400" /> Language Accessibility
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  We are committed to providing access to housing information regardless of language proficiency and will make reasonable efforts to accommodate Limited English Proficiency (LEP) individuals.
                </p>
              </div>

              {/* Accessibility and Disability Compliance */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <ChevronRight size={20} className="ml-2 text-gray-400" /> Accessibility and Disability Compliance
                </h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  14 For Rent, LLC provides reasonable accommodations and modifications in housing and application processes for persons with disabilities, in compliance with:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4">
                  <li>The Americans with Disabilities Act (ADA)</li>
                  <li>The Rehabilitation Act of 1973</li>
                  <li>The Fair Housing Amendments Act of 1988</li>
                  <li>California Civil Code Section 54.1</li>
                </ul>
              </div>

              {/* Report Concerns */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Phone size={24} className="mr-3 text-[#1A2953]" /> Report Concerns
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  If you have questions or concerns related to fair housing in connection with a property listed or marketed by 14 For Rent, LLC, you may contact us directly at:
                </p>
                <div className="text-gray-700 mt-4 space-y-2">
                  <p className="font-semibold">14 For Rent, LLC</p>
                  <p className="flex items-center">
                    <Mail size={18} className="mr-2 text-[#1A2953]" />
                    Email: <a href="mailto:info@14ForRent.com" className="text-[#1A2953] hover:underline ml-1">info@14ForRent.com</a>
                  </p>
                  <p className="flex items-center">
                    <Phone size={18} className="mr-2 text-[#1A2953]" />
                    Phone: 323-774-4700
                  </p>
                  <p className="flex items-center">
                    <MapPin size={18} className="mr-2 text-[#1A2953]" />
                    Office: Los Angeles, CA 90048
                  </p>
                </div>

                <p className="text-gray-700 leading-relaxed mt-6 font-semibold">
                  You can also contact federal and state agencies:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 pl-4 mt-2">
                  <li>U.S. Department of Housing and Urban Development (HUD): <a href="https://www.hud.gov/fairhousing" target="_blank" rel="noopener noreferrer" className="text-[#1A2953] hover:underline">www.hud.gov/fairhousing</a></li>
                  <li>California Civil Rights Department: <a href="https://calcivilrights.ca.gov" target="_blank" rel="noopener noreferrer" className="text-[#1A2953] hover:underline">calcivilrights.ca.gov</a></li>
                </ul>
              </div>

              {/* Our Commitment (Final Statement) */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <CheckCircle2 size={24} className="mr-3 text-green-600" /> Our Commitment:
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  Fair Housing is not just the law — it’s our standard.
                  We are proud to support inclusive, safe, and equitable housing access for all.
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

export default FairHousing;