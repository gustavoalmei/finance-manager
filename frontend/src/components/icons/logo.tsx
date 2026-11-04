import type { SVGProps } from "react"
import { cn } from "#/lib/utils"

// fill="currentColor": a cor vem das classes text-* e acompanha o tema
export const Logo = ({ className, ...props }: SVGProps<SVGSVGElement>) => (
  <svg
    width="59"
    height="80"
    viewBox="0 0 59 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Logo"
    className={cn("text-foreground", className)}
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M39.5395 1.52588e-05L54.8327 18.1304L58.3999 51.6333L31.4064 80.0001L0 51.5401L15.8138 11.303L39.5395 1.52588e-05ZM17.1852 14.392L29.7993 27.7175L16.8992 46.4281L3.37936 49.5201L17.1852 14.392ZM3.9478 51.8653L27.9224 73.5909L16.927 48.8973L3.9478 51.8653ZM19.56 48.8941L31.7117 76.1845L54.5595 52.1745L19.56 48.8941ZM55.6123 48.1693L52.6487 20.3396L33.5719 28.0026L55.6123 48.1693ZM31.6546 26.1731L51.6803 18.129L38.8991 2.97672L18.773 12.5649L31.6546 26.1731ZM31.5507 29.4194L53.6807 49.6681L19.7808 46.4909L31.5507 29.4194Z"
      fill="currentColor"
    />
  </svg>
)
