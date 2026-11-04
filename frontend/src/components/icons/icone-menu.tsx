import type { SVGProps } from "react"

// stroke="currentColor" herda a cor de `color` (classes text-*), então o ícone
// acompanha os tokens do tema (light/dark) definidos em styles.css.
export const IconeMenu = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1.33334 3.33333C1.33334 2.97971 1.47382 2.64057 1.72387 2.39052C1.97392 2.14048 2.31305 2 2.66668 2H6.66668V14H2.66668C2.31305 14 1.97392 13.8595 1.72387 13.6095C1.47382 13.3594 1.33334 13.0203 1.33334 12.6667V3.33333ZM9.33334 2H13.3333C13.687 2 14.0261 2.14048 14.2762 2.39052C14.5262 2.64057 14.6667 2.97971 14.6667 3.33333V6.66667H9.33334V2ZM9.33334 9.33333H14.6667V12.6667C14.6667 13.0203 14.5262 13.3594 14.2762 13.6095C14.0261 13.8595 13.687 14 13.3333 14H9.33334V9.33333Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
