
import { Phone, Mail } from "lucide-react";
import ContactForm from "@/components/ContactForm";

interface PropertyContactSectionProps {
  propertyId: string;
  propertyTitle: string;
}

const PropertyContactSection = ({ propertyId, propertyTitle }: PropertyContactSectionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">Contact Agent</h2>
      <div className="space-y-4">
        <p className="flex items-center text-gray-700 text-lg">
          <Phone size={20} className="mr-3 text-[#1A2953]" />
          <a href="tel:+13237744700" className="hover:underline text-[#1A2953]">+1 323-774-4700</a>
        </p>
        <p className="flex items-center text-gray-700 text-lg">
          <Mail size={20} className="mr-3 text-[#1A2953]" />
          <a href="mailto:contact@14forrent.com" className="hover:underline text-[#1A2953]">contact@14forrent.com</a>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t-2 border-gray-100">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Inquire About This Property</h3>
        <ContactForm propertyId={propertyId} propertyTitle={propertyTitle} />
      </div>
    </div>
  );
};

export default PropertyContactSection;
