import HubSubLayout from "@/components/HubSubLayout";
import ComingSoonHub from "@/components/ComingSoonHub";

const MicrochipScreen = () => (
  <HubSubLayout title="Microchipping" emoji="💉">
    <ComingSoonHub
      feature="microchip"
      emoji="💉"
      headline="Find a microchip vet near you"
      description="ISO-compliant microchip implant + lifetime registry on Petosauras."
      bullets={[
        "List of certified microchip clinics",
        "ISO 11784/11785 compliant chips",
        "Linked to your Petosauras pet profile",
        "Help recover lost pets faster",
      ]}
    />
  </HubSubLayout>
);

export default MicrochipScreen;
