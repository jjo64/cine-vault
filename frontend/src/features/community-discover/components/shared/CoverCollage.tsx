import { useState } from "react";
import { Img } from "../../../../components/shared/Img";
import { C } from "../../constants";

export function CoverCollage({
  posters,
  customCover,
  premium,
  glowColor,
}: {
  posters: string[];
  customCover?: string;
  premium: boolean;
  glowColor: string;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{ position: "relative", overflow: "hidden", aspectRatio: "3/2" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at 50% 110%, rgba(${glowColor}, ${hov ? 0.32 : 0.16}) 0%, transparent 70%)`,
          transition: "opacity 0.5s",
          mixBlendMode: "screen",
        }}
      />

      {premium && customCover ? (
        <Img
          src={customCover}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `saturate(0.55) brightness(${hov ? 0.8 : 0.65})`,
            transition: "filter 0.45s, transform 0.5s",
            transform: hov ? "scale(1.04)" : "scale(1)",
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            width: "100%",
            height: "100%",
            gap: 1.5,
            background: C.bg,
          }}
        >
          {posters.slice(0, 4).map((src, i) => (
            <div key={i} style={{ overflow: "hidden", position: "relative" }}>
              <Img
                src={src}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  filter: `saturate(${hov ? 0.65 : 0.45}) brightness(${hov ? 0.85 : 0.7})`,
                  transition: "filter 0.45s, transform 0.5s",
                  transform: hov ? "scale(1.06)" : "scale(1)",
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          zIndex: 3,
          background:
            "linear-gradient(to bottom, rgba(8,8,8,0.55), transparent)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "45%",
          zIndex: 3,
          background: "linear-gradient(to top, rgba(8,8,8,0.72), transparent)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
