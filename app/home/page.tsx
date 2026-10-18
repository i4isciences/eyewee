import { PersonaExperience } from "@/components/PersonaExperience";
import { ConsentGate } from "@/components/ConsentGate";

export default function HomePage() {
  return (
    <ConsentGate>
      <PersonaExperience />
    </ConsentGate>
  );
}
