export function NavbarCount({ count }: { count: number }) {
  return count > 0 ? (
    <span
      aria-hidden="true"
      className="relative top-1 -translate-y-2/3 shrink-0 self-start whitespace-nowrap font-body font-normal text-xs leading-none tracking-[0.02em]"
    >
      {count}
    </span>
  ) : null;
}
