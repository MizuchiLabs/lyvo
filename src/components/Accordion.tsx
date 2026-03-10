import {
  Accordion as AccordionRoot,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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
    <div className="not-prose">
      <AccordionRoot className={className}>
        {items.map((item, i) => {
          const value = item.value || `item-${i}`;
          return (
            <AccordionItem key={value} value={value}>
              <AccordionTrigger className="font-semibold text-md">{item.title}</AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          );
        })}
      </AccordionRoot>
    </div>
  );
}
