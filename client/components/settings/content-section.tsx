import type { ReactNode } from "react";
import { Separator } from "@gorth/primitive/default/separator";

export function ContentSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full max-w-2xl flex-col">
      <div>
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      <Separator className="my-4" />
      {children}
    </section>
  );
}
