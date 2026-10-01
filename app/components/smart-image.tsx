import Image from 'next/image';

export function SmartImage({ src, alt, width, height, className = '' }: { src: string; alt: string; width: number; height: number; className?: string }) {
  if (src.startsWith('/')) return <Image src={src} alt={alt} width={width} height={height} className={className} />;
  return <img src={src} alt={alt} width={width} height={height} className={className} loading="lazy" />;
}
