import HubSubLayout from "@/components/HubSubLayout";
import WizardShell from "@/components/pet-recommender/WizardShell";

const RecommenderScreen = () => (
  <HubSubLayout
    title="Pet Recommender"
    subtitle="Find the right pet for your intent, lifestyle and budget."
  >
    <WizardShell />
  </HubSubLayout>
);

export default RecommenderScreen;
