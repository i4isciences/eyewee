import type { Metadata } from "next";
import { DocumentViewer } from "@/components/document/DocumentViewer";

export const metadata: Metadata = {
  title: "eyewee — Document Search",
};

export default function DocumentSearchDemoPage() {
  return (
    <div className="docsearch-page">
      <DocumentViewer
        title="Persistence of cccDNA as a Barrier to Functional HBV Cure"
        meta="Postdoctoral Dissertation Chapter 3 — Results and Discussion (demo content)"
      >
        <h2>3.1 Background</h2>
        <p>
          Chronic hepatitis B virus infection remains incurable in the majority of patients despite decades of effective viral suppression
          through nucleos(t)ide analog therapy. The central obstacle to a functional cure is the persistence of covalently closed circular
          DNA, or cccDNA, a stable minichromosome that resides in the nucleus of infected hepatocytes and serves as the transcriptional
          template for all viral RNAs.
        </p>
        <p>
          Unlike the reverse-transcribed viral genome targeted by current antivirals, cccDNA is not degraded by nucleos(t)ide analog
          therapy. Its long half-life in quiescent hepatocytes allows low-level transcription to continue indefinitely, which explains the
          near-universal relapse observed after treatment discontinuation.
        </p>

        <h2>3.2 Cohort Findings</h2>
        <p>
          Across twelve patient-derived hepatocyte cultures maintained under nucleos(t)ide analog therapy for eighteen months, cccDNA
          remained detectable by quantitative PCR in every culture sampled. No culture achieved complete cccDNA clearance, regardless of
          baseline viral load or duration of suppressive therapy.
        </p>
        <p>
          These findings are consistent with prior reports describing cccDNA as a durable reservoir that is functionally insulated from
          standard antiviral mechanisms. The data presented here extend that literature by quantifying persistence specifically in a
          therapy-experienced cohort rather than treatment-naive samples.
        </p>

        <h2>3.3 Implications for Curative Strategy</h2>
        <p>
          Given that cccDNA persistence is the rate-limiting step toward cure, combination approaches that directly target the
          minichromosome — including siRNA-mediated silencing and CRISPR-based base editing — represent the most promising path forward.
          Maintenance nucleos(t)ide analog therapy alone, however durable, cannot achieve cure without addressing this reservoir directly.
        </p>
        <p>
          Future work will validate whether cccDNA silencing achieved in vitro translates to durable suppression in a humanized mouse
          model, where reservoir dynamics can be assessed longitudinally under physiologically relevant immune pressure.
        </p>
      </DocumentViewer>

      <p className="docsearch-hint">
        Try it: click <strong>Search</strong> above, or press <strong>Ctrl+F</strong> (Cmd+F on Mac) — this is real, selectable text, so
        native find already works alongside the in-app bar.
      </p>
    </div>
  );
}
