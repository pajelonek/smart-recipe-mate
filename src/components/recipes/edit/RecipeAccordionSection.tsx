import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface RecipeAccordionSectionProps {
  title: string;
  content: string;
  value: string;
}

export function RecipeAccordionSection({ title, content, value }: Readonly<RecipeAccordionSectionProps>) {
  return (
    <AccordionItem value={value}>
      <AccordionTrigger className="text-left font-semibold">{title}</AccordionTrigger>
      <AccordionContent>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{content}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
