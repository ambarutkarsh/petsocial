import petCareData from "@/data/petcare-data.json";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { mapAgeToGroup, type AgeBucket, type Weather } from "@/lib/petCareHelpers";

interface Props {
  petType: string;
  breed: string;
  age: AgeBucket;
  weightKg?: string;
  weather: Weather;
}

interface AgeGroupShape {
  label?: string;
  description?: string;
  proteinPercent?: string;
  fatPercent?: string;
  mealsPerDay?: number;
  keyNutrients?: string[];
  recommended?: string[];
  avoid?: string[];
  indianHomeFood?: string;
  portionByWeight?: Record<string, string>;
  weatherTips?: Record<string, string>;
}

const Card = ({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) => (
  <div className="rounded-[18px] bg-card border border-border shadow-petosauras p-4" style={{ borderLeft: `4px solid ${accent}` }}>
    <h3 className="font-heading font-bold text-[14px] mb-2">{title}</h3>
    <div className="text-[13px] font-body text-foreground/90 leading-relaxed">{children}</div>
  </div>
);

const DietResults = ({ petType, breed, age, weightKg, weather }: Props) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const diet = (petCareData.diet.pets as any)[petType];
  const ageKey = mapAgeToGroup(petType, age);
  const plan: AgeGroupShape | undefined = diet?.ageGroups?.[ageKey];
  const breedNote: string | undefined = diet?.breedNotes?.[breed];

  // Pet types that don't have ageGroups (Avian/Aquatic/Reptile/Small Pet) — fall back to general
  const general = diet?.general;

  if (!plan && !general) {
    return (
      <div className="rounded-[18px] bg-muted p-4 text-[13px] font-body text-muted-foreground">
        Detailed diet information for {petType} is coming soon.
      </div>
    );
  }

  // Resolve recommended foods/avoid for general (species-keyed) blocks
  const generalRecommended: string[] | undefined = general?.recommended?.[breed];
  const generalBySpecies = general?.bySpecies?.[breed];

  return (
    <div className="space-y-3">
      {plan && (
        <>
          <Card title={`Daily Diet Plan — ${plan.label ?? age}`} accent="hsl(265 35% 50%)">
            {plan.description && <p className="mb-2">{plan.description}</p>}
            <ul className="space-y-1 text-[12px]">
              {plan.proteinPercent && <li>• <strong>Protein:</strong> {plan.proteinPercent}</li>}
              {plan.fatPercent && <li>• <strong>Fat:</strong> {plan.fatPercent}</li>}
              {plan.mealsPerDay && <li>• <strong>Meals per day:</strong> {plan.mealsPerDay}</li>}
            </ul>
            {plan.keyNutrients && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {plan.keyNutrients.map((n) => (
                  <span key={n} className="text-[11px] px-2 py-0.5 rounded-full bg-primary-light text-primary font-heading font-semibold">{n}</span>
                ))}
              </div>
            )}
          </Card>

          {plan.recommended && (
            <Card title="✅ Recommended" accent="hsl(145 60% 45%)">
              <ul className="space-y-1">
                {plan.recommended.map((r) => <li key={r}>✅ {r}</li>)}
              </ul>
            </Card>
          )}

          {plan.avoid && (
            <Card title="❌ Avoid These" accent="hsl(0 70% 55%)">
              <ul className="space-y-1">
                {plan.avoid.map((r) => <li key={r}>❌ {r}</li>)}
              </ul>
            </Card>
          )}

          {plan.indianHomeFood && (
            <Card title="🍛 Indian Home Food Guide" accent="hsl(265 50% 55%)">
              {plan.indianHomeFood}
            </Card>
          )}

          {plan.portionByWeight && (
            <Card title="📏 How Much to Feed" accent="hsl(210 70% 50%)">
              <table className="w-full text-[12px]">
                <tbody>
                  {Object.entries(plan.portionByWeight).map(([range, qty]) => {
                    const w = parseFloat(weightKg ?? "");
                    // crude highlight: parse first number(s) from range
                    const m = range.match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
                    const lo = m ? parseInt(m[1], 10) : 0;
                    const hi = m && m[2] ? parseInt(m[2], 10) : Infinity;
                    const highlight = !isNaN(w) && w >= lo && w <= hi;
                    return (
                      <tr key={range} className={highlight ? "bg-primary-light font-heading font-bold" : ""}>
                        <td className="py-1 pr-2">{range}</td>
                        <td className="py-1">{qty as string}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}

          {plan.weatherTips?.[weather] && (
            <Card title="🌤️ Weather Tips" accent="hsl(40 85% 55%)">
              {plan.weatherTips[weather]}
            </Card>
          )}
        </>
      )}

      {/* General-only pet types */}
      {!plan && general && (
        <>
          {general.label && (
            <Card title={general.label} accent="hsl(265 35% 50%)">
              {general.description}
              {general.keyPrinciple && <p className="mt-2 text-[12px] italic">{general.keyPrinciple}</p>}
            </Card>
          )}
          {generalRecommended && (
            <Card title={`✅ Recommended for ${breed}`} accent="hsl(145 60% 45%)">
              <ul className="space-y-1">
                {generalRecommended.map((r) => <li key={r}>✅ {r}</li>)}
              </ul>
            </Card>
          )}
          {generalBySpecies && (
            <Card title={`🐾 ${breed} care`} accent="hsl(265 35% 50%)">
              <ul className="space-y-1 text-[12px]">
                {Object.entries(generalBySpecies).map(([k, v]) => (
                  <li key={k}><strong className="capitalize">{k}:</strong> {String(v)}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {breedNote && (
        <div className="rounded-[18px] bg-[hsl(40_95%_94%)] border border-[hsl(40_85%_75%)] p-4">
          <h3 className="font-heading font-bold text-[14px] mb-1">💡 Note for {breed}</h3>
          <p className="text-[13px] font-body text-[hsl(35_70%_28%)]">{breedNote}</p>
        </div>
      )}
    </div>
  );
};

export default DietResults;
