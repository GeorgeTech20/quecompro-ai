/** Logo tipográfico. Sin imagen: el `.ai` es el acento de marca. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`text-ink font-semibold tracking-tight ${className}`}>
      QueCompro<span className="text-brand-600">.ai</span>
    </span>
  );
}
