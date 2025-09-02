
import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import { Phone, Mail } from "lucide-react";

const ContactForm = lazy(() => import("@/components/ContactForm"));

const Contact = () => {
  return (
    <>
      <SEOMeta 
        title="14ForRent - Contact Us | Get Help with Your Rental Search"
        description="Contact 14ForRent for assistance with property rentals, questions about listings, or support with our platform. We're here to help you find your perfect home."
        keywords="contact 14ForRent, rental support, property help, customer service, rental assistance"
        url="https://14forrent.com/contact"
        type="website"
        canonical="https://14forrent.com/contact"
      />
      <Navbar />
      
      <div className="bg-gray-50 py-12 md:py-20">
        <div className="forrent-container">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-forrent-navy mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about a property or need assistance? We're here to help you find your perfect rental.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-forrent-navy mb-6">Contact Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-forrent-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Phone</h3>
                    <p className="text-gray-600">+1 323-774-4700</p>
                    <p className="text-sm text-gray-500">Available 24/7 for urgent matters</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-forrent-orange mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800">Email</h3>
                    <p className="text-gray-600">info@14ForRent.com</p>
                    <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-forrent-navy mb-6">Send us a Message</h2>
              <Suspense fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              }>
                <ContactForm />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
};

export default Contact;
