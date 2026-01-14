import { cn } from "@/lib/utils";

export const AgentLogo = ({ animating }: { animating?: boolean }) => {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700",
      )}
    >
      {animating && (
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          viewBox="0 0 32 32"
        >
          <circle
            cx="16"
            cy="16"
            r="15"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="30 60"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      )}

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={32}
        height={32}
        viewBox="0 0 32 32"
        className="relative z-10"
      >
        <path
          fill="currentColor"
          d="M17 11h3v10h-3v2h8v-2h-3V11h3V9h-8zm-4-2H9c-1.103 0-2 .897-2 2v12h2v-5h4v5h2V11c0-1.103-.897-2-2-2m-4 7v-5h4v5z"
        ></path>
      </svg>
    </div>
  );
};
