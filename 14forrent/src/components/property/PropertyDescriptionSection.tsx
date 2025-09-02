
interface PropertyDescriptionSectionProps {
  description?: string;
}

const PropertyDescriptionSection = ({ description }: PropertyDescriptionSectionProps) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-100 pb-2">Description</h2>
      <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
        {description || "No detailed description available for this property. Please contact us for more information."}
      </div>
    </div>
  );
};

export default PropertyDescriptionSection;
