import { useMemo } from "react";
import { motion } from "motion/react";
import { C, SANS } from "../constants";
import { SectionLabel } from "./shared/SectionLabel";
import { useTVDetailStore } from "../store/useTVDetailStore";

export function Platforms() {
  const detail = useTVDetailStore((state) => state.detail);

  const providers = useMemo(() => {
    if (!detail?.watch_providers)
      return [] as { region: string; names: string[] }[];
    const preferred = ["ES", "US", "AR", "MX"];
    const entries = Object.entries(detail.watch_providers);
    const selected = preferred
      .map((code) => ({ region: code, entry: detail.watch_providers![code] }))
      .filter((x) => !!x.entry);
    const source =
      selected.length > 0
        ? selected.map((x) => ({ region: x.region, entry: x.entry }))
        : entries.slice(0, 3).map(([region, entry]) => ({ region, entry }));
    return source
      .map(({ region, entry }) => {
        const all = [
          ...(entry.flatrate || []),
          ...(entry.rent || []),
          ...(entry.buy || []),
        ];
        const names = Array.from(
          new Set(all.map((p) => p.provider_name)),
        ).slice(0, 6);
        return { region, names };
      })
      .filter((x) => x.names.length > 0);
  }, [detail?.watch_providers]);

  if (providers.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ marginBottom: 32 }}
    >
      <SectionLabel>Dónde verla</SectionLabel>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {providers.flatMap(({ region, names }) =>
          names.map((name) => (
            <div
              key={`${region}-${name}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: C.surface,
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontFamily: SANS, fontSize: 11, color: C.text }}>
                {name}
              </span>
              <span
                style={{ fontSize: 9, color: C.textMuted, fontFamily: SANS }}
              >
                {region}
              </span>
            </div>
          )),
        )}
      </div>
    </motion.section>
  );
}
