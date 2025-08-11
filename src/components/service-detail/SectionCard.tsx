import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionCardProps {
  title: string;
  description?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function SectionCard({ title, description, rightSlot, children }: SectionCardProps) {
  return (
    <section aria-labelledby={`section-${title}`} className="relative">
      <Card className="border-border/60 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <div>
            <CardTitle id={`section-${title}`} className="text-base font-semibold tracking-tight">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-muted-foreground mt-1">
                {description}
              </CardDescription>
            ) : null}
          </div>
          {rightSlot}
        </CardHeader>
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

export default SectionCard;
