import HubSubLayout from "@/components/HubSubLayout";
import ComingSoonHub from "@/components/ComingSoonHub";

const PickupScreen = () => (
  <HubSubLayout title="Pet Pick & Drop" emoji="🚗">
    <ComingSoonHub
      feature="pickup"
      emoji="🚗"
      headline="On-demand pet rides"
      description="Verified drivers to ferry your pet to the vet, groomer, or boarding — safely."
      bullets={[
        "Pet-friendly vehicles with crates / harnesses",
        "Vetted, background-checked drivers",
        "Live tracking + driver photo",
        "One-way and round-trip booking",
      ]}
    />
  </HubSubLayout>
);

export default PickupScreen;
