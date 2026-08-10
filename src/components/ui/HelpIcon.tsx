import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface HelpIconProps {
  text: string;
}

export default function HelpIcon({ text }: HelpIconProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 flex items-center justify-center cursor-help focus:outline-none" aria-label="Help info">
            <HelpCircle className="h-4.5 w-4.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 leading-relaxed bg-popover text-popover-foreground border shadow-lg font-normal rounded-xl">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
