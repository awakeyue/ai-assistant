"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateFilterProps {
  currentTemplate: string;
}

const TEMPLATE_OPTIONS = [
  { value: "all", label: "全部模板" },
  { value: "react", label: "React" },
  { value: "react-ts", label: "React TypeScript" },
  { value: "vue", label: "Vue" },
  { value: "vue-ts", label: "Vue TypeScript" },
  { value: "vanilla", label: "JavaScript" },
  { value: "vanilla-ts", label: "TypeScript" },
  { value: "static", label: "HTML" },
];

export function TemplateFilter({ currentTemplate }: TemplateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams();
    // Reset to page 1 when changing filter
    params.set("page", "1");
    if (value !== "all") {
      params.set("template", value);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <Select
      value={currentTemplate}
      onValueChange={handleValueChange}
      disabled={isPending}
    >
      <SelectTrigger className={cn("w-40", isPending && "opacity-70")}>
        {isPending ? (
          <Loader2 size={14} className="mr-2 animate-spin" />
        ) : (
          <Filter size={14} className="mr-2 opacity-50" />
        )}
        <SelectValue placeholder="选择模板" />
      </SelectTrigger>
      <SelectContent>
        {TEMPLATE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
