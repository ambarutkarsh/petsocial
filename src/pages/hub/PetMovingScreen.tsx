import HubSubLayout from "@/components/HubSubLayout";
import ComingSoonHub from "@/components/ComingSoonHub";

const PetMovingScreen = () => (
  <HubSubLayout title="Pet Moving" emoji="🚛">
    <ComingSoonHub
      feature="pet_moving"
      emoji="🚛"
      headline="Relocate your pet, stress-free"
      description="End-to-end domestic & international pet relocation with paperwork, crates and customs handled."
      bullets={[
        "Domestic city-to-city transport",
        "International export with documentation",
        "IATA-approved crates",
        "Quarantine & vaccine guidance",
      ]}
    />
  </HubSubLayout>
);

export default PetMovingScreen;
