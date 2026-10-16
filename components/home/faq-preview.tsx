import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { FaqList } from "@/components/site/faq-list";
import { SectionHeading } from "@/components/site/section-heading";
import { Button } from "@/components/ui/button";
import type { Faq } from "@/lib/content";

export function FaqPreview({ faqs }: { faqs: Faq[] }) {
  return (
    <section className="py-20 lg:py-28">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionHeading
            align="stack"
            eyebrow="Questions"
            title="Good to know before you order."
            description="MOQ, payment, production time and shipping in short answers."
          />
          <Button asChild variant="outline" className="mt-8">
            <Link href="/faq">
              All questions <ArrowRight />
            </Link>
          </Button>
        </div>
        <FaqList faqs={faqs} className="self-start lg:col-span-8" />
      </Container>
    </section>
  );
}
