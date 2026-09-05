import { Check } from "lucide-react";
import type { ComponentProps } from "react";
export function Checkbox(props: Omit<ComponentProps<"input">, "type">) {
  return <span className="relative inline-flex size-6 shrink-0"><input {...props} type="checkbox" className={`peer kaki-checkbox ${props.className ?? ""}`} /><Check aria-hidden="true" className="pointer-events-none absolute inset-1 size-4 text-white opacity-0 peer-checked:opacity-100" /></span>;
}
