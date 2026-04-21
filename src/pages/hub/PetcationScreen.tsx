import HubSubLayout from "@/components/HubSubLayout";
import ComingSoonHub from "@/components/ComingSoonHub";

const PetcationScreen = () => (
  <HubSubLayout title="Petcation" emoji="✈️">
    <ComingSoonHub
      feature="petcation"
      emoji="✈️"
      headline="Pet-friendly stays & getaways"
      description="Browse hotels, homestays and resorts across India that genuinely welcome your pet."
      bullets={[
        "Verified pet-friendly properties",
        "Filter by size, breed restrictions, fees",
        "Vet & emergency clinics nearby",
        "Petosauras member discounts",
      ]}
    />
  </HubSubLayout>
);

export default PetcationScreen;
