import { memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { UserModelConfig } from "@/types/chat";

export const ModelLogo = memo(function ModelLogo({
  model,
  size = "sm",
}: {
  model: UserModelConfig | undefined;
  size?: "sm" | "md";
}) {
  const sizeClass = size === "sm" ? "size-4" : "size-5";

  if (!model?.logoUrl) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center rounded border",
          sizeClass,
        )}
      >
        <span className="text-muted-foreground font-medium">
          {model?.name?.charAt(0)?.toUpperCase() || "M"}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded", sizeClass)}>
      <Image
        src={model.logoUrl}
        alt={model.name}
        width={size === "sm" ? 16 : 20}
        height={size === "sm" ? 16 : 20}
        className="size-full object-cover"
      />
    </div>
  );
});
ModelLogo.displayName = "ModelLogo";
