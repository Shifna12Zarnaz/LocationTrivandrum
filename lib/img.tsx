// Photo or warm placeholder. Real photos come from Cloudflare R2 in phase 3.
export function Photo({ src, tone, alt, className = "", priority = false }: { src?: string | null; tone: number; alt: string; className?: string; priority?: boolean }) {
  if (src) return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" className={`object-cover ${className}`} />;
  return (
    <div role={alt ? "img" : undefined} aria-label={alt || undefined} className={className}
      style={{ background: `radial-gradient(60% 70% at 65% 45%, hsl(${tone} 45% 38%) 0%, hsl(${tone} 40% 20%) 55%, #1b1612 100%)` }} />
  );
}
