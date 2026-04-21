import HubSubLayout from "@/components/HubSubLayout";
import ComingSoonHub from "@/components/ComingSoonHub";

const RecommenderScreen = () => (
  <HubSubLayout title="Pet Recommender" emoji="🐾">
    <ComingSoonHub
      feature="recommender"
      emoji="🐾"
      headline="Find your perfect pet match"
      description="AI-driven quiz that suggests breeds based on your home, lifestyle, budget and city climate."
      bullets={[
        "8-question lifestyle quiz",
        "Top 3 breed matches with reasons",
        "Estimated monthly cost in your city",
        "Local adoption + breeder links",
      ]}
    />
  </HubSubLayout>
);

export default RecommenderScreen;
