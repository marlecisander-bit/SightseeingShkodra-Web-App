import Image from "next/image";

export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <Image
      className="p-brand-logo"
      src={light ? "/brand/logo-light.svg" : "/brand/logo-color.svg"}
      alt="Sightseeing Shkodra"
      width={345}
      height={103}
      unoptimized
      loading="eager"
    />
  );
}
