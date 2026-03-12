import {
  Accordion as AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

interface AccordionProps {
  items: {
    title: string;
    content: React.ReactNode;
    value?: string;
  }[];
  className?: string;
}

export default function Accordion({ items, className }: AccordionProps) {
  return (
    <AccordionRoot className={cn("not-prose my-4", className)}>
      {items.map((item, i) => {
        const value = item.value || `item-${i}`;
        return (
          <AccordionItem key={value} value={value}>
            <AccordionTrigger className="text-base font-medium">{item.title}</AccordionTrigger>
            <AccordionContent className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </AccordionRoot>
  );
}
