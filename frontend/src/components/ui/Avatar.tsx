import { cn } from "../../lib/utils";
import { initials } from "../../lib/utils";

interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

const GRADIENTS = [
  "from-indigo-400 to-purple-400",
  "from-rose-300 to-pink-400",
  "from-amber-300 to-orange-400",
  "from-emerald-300 to-teal-400",
  "from-sky-300 to-blue-400",
];

function gradientFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i)) % GRADIENTS.length;
  return GRADIENTS[hash];
}

export function Avatar({ name, size = 32, className }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        gradientFor(name),
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}
