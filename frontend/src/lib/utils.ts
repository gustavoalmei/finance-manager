import { clsx } from "clsx"
import type { ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Tokens próprios do @theme precisam ser registrados para o merge resolver conflitos
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ["panel"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
