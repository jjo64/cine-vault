import { C } from "../../constants";

export function Stars({ n, size = 12 }: { n: number; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: size,
            color: i <= n ? C.gold : C.textMuted,
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
