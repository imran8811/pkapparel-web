import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { JsonLd } from "@/components/site/json-ld";
import type { Faq } from "@/lib/content";
import { cn } from "@/lib/utils";

/** Expandable questions and answers. Adds FAQPage structured data when `structuredData` is set. */
export function FaqList({ faqs, structuredData = false, className }: { faqs: Faq[]; structuredData?: boolean; className?: string }) {
  return (
    <>
      <Accordion type="multiple" className={cn("rounded-3xl border border-border bg-card px-6", className)}>
        {faqs.map((faq) => (
          <AccordionItem key={faq.id} value={String(faq.id)} className="border-dashed">
            <AccordionTrigger className="py-5 text-left text-base font-semibold hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-[15px] leading-relaxed text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {structuredData && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }}
        />
      )}
    </>
  );
}
