import { useState } from "react";
import { Link } from "react-router";
import { Eye, Trophy } from "lucide-react";
import type { FeedItem } from "../../types";
import { fmtCount } from "../../../../utils/stringUtils";

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: 15,
            color: i <= n ? "var(--color-gold)" : "rgba(255,255,255,0.2)",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export function ReviewContent({
  item,
}: {
  item: Extract<FeedItem, { type: "review" }>;
}) {
  const [expanded, setExpanded] = useState(false);
  const MAX = 160;
  const isLong = item.text.length > MAX;
  const displayText =
    expanded || !isLong ? item.text : item.text.slice(0, MAX) + "...";

  return (
    <>
      <Link
        to={`/film/${item.film.id}`}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            padding: "3px 10px",
            background: "rgba(212,175,122,0.1)",
            border: `1px solid var(--color-accent-dim)`,
            backdropFilter: "blur(8px)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 14,
              fontStyle: "italic",
              color: "var(--color-accent)",
            }}
          >
            {item.film.title}
          </span>
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 10,
              color: "var(--color-text-soft)",
              marginLeft: 8,
            }}
          >
            {item.film.year} · {item.film.director}
          </span>
        </div>
      </Link>
      <div style={{ marginBottom: 10 }}>
        <Stars n={item.rating} />
      </div>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 18,
          lineHeight: 1.65,
          color: "rgba(226,226,226,0.92)",
          margin: "0 0 6px",
          maxWidth: 560,
        }}
      >
        {displayText}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-accent)",
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            letterSpacing: "0.14em",
            padding: 0,
            marginBottom: 12,
          }}
        >
          {expanded ? "Ver menos" : "Ver más"}
        </button>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        {item.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              padding: "3px 9px",
              backdropFilter: "blur(6px)",
              fontFamily: "var(--font-sans)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </>
  );
}

export function VaultContent({
  item,
}: {
  item: Extract<FeedItem, { type: "vault" }>;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {item.vaultType}
        </span>
        <span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
          ·
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-soft)",
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Eye size={11} /> {fmtCount(item.views)} vistas · {item.duration}
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 26,
          fontWeight: 400,
          lineHeight: 1.15,
          color: "var(--color-text)",
          marginBottom: 10,
          maxWidth: 500,
        }}
      >
        {item.title}
      </div>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 16,
          color: "rgba(226,226,226,0.65)",
          lineHeight: 1.6,
          margin: 0,
          maxWidth: 480,
        }}
      >
        {item.description}
      </p>
    </>
  );
}

export function TonightContent({
  item,
}: {
  item: Extract<FeedItem, { type: "tonight" }>;
}) {
  const [marked, setMarked] = useState(false);
  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 9,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 10,
          }}
        >
          Esta noche, sin excusas
        </div>
        <Link to={`/film/${item.film.id}`} style={{ textDecoration: "none" }}>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 300,
              lineHeight: 1.05,
              color: "var(--color-text)",
              marginBottom: 4,
            }}
          >
            {item.film.title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: 17,
              color: "var(--color-text-soft)",
              marginBottom: 14,
            }}
          >
            {item.film.director} · {item.film.year} · {item.film.duration}
          </div>
        </Link>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 17,
            color: "rgba(226,226,226,0.7)",
            lineHeight: 1.65,
            margin: "0 0 20px",
            maxWidth: 500,
          }}
        >
          {item.description}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={() => setMarked((v) => !v)}
          style={{
            padding: "10px 22px",
            background: marked
              ? "var(--color-accent-dim)"
              : "var(--color-accent)",
            color: "var(--color-bg)",
            border: "none",
            fontFamily: "var(--font-sans)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s",
            backdropFilter: "blur(8px)",
          }}
        >
          {marked ? "✓ Vista" : "Marcar como vista"}
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--color-gold)",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
          }}
        >
          <Trophy
            size={13}
            fill="var(--color-gold)"
            color="var(--color-gold)"
          />{" "}
          +{item.points} pts esta noche
        </div>
      </div>
    </>
  );
}

export function DiscoveryContent({
  item,
}: {
  item: Extract<FeedItem, { type: "discovery" }>;
}) {
  return (
    <>
      <Link to={`/film/${item.film.id}`} style={{ textDecoration: "none" }}>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 22,
            color: "var(--color-accent)",
            marginBottom: 10,
            lineHeight: 1.3,
          }}
        >
          "{item.quote}"
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(30px, 4vw, 46px)",
            fontWeight: 300,
            lineHeight: 1.05,
            color: "var(--color-text)",
            marginBottom: 6,
          }}
        >
          {item.film.title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 16,
            color: "var(--color-text-soft)",
            marginBottom: 16,
          }}
        >
          {item.film.director} · {item.film.year}{" "}
          {item.film.duration ? `· ${item.film.duration}` : ""}
        </div>
      </Link>
      <p
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 17,
          color: "rgba(226,226,226,0.65)",
          lineHeight: 1.65,
          margin: 0,
          maxWidth: 500,
        }}
      >
        {item.description}
      </p>
    </>
  );
}

export function ListContent({
  item,
}: {
  item: Extract<FeedItem, { type: "list" }>;
}) {
  return (
    <>
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 9,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: "var(--color-accent)",
            marginBottom: 8,
          }}
        >
          Lista curada · {item.count} películas
        </div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.1,
            color: "var(--color-text)",
            marginBottom: 10,
          }}
        >
          {item.listTitle}
        </div>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontStyle: "italic",
            fontSize: 17,
            color: "rgba(226,226,226,0.65)",
            lineHeight: 1.65,
            margin: "0 0 16px",
            maxWidth: 460,
          }}
        >
          {item.description}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {item.films.map((f) => (
          <span
            key={f}
            style={{
              fontSize: 11,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.55)",
              borderLeft: `2px solid var(--color-accent-dim)`,
              paddingLeft: 8,
            }}
          >
            {f}
          </span>
        ))}
        <span
          style={{
            fontSize: 11,
            fontFamily: "var(--font-sans)",
            color: "var(--color-text-muted)",
          }}
        >
          +{item.count - item.films.length} más
        </span>
      </div>
    </>
  );
}

export function QuoteContent({
  item,
}: {
  item: Extract<FeedItem, { type: "quote" }>;
}) {
  return (
    <div style={{ maxWidth: 580 }}>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(22px, 3vw, 32px)",
          fontStyle: "italic",
          fontWeight: 300,
          lineHeight: 1.65,
          color: "rgba(226,226,226,0.9)",
          marginBottom: 20,
        }}
      >
        <span
          style={{
            color: "var(--color-accent)",
            fontSize: "1.5em",
            lineHeight: 0.7,
            verticalAlign: "bottom",
            marginRight: 4,
          }}
        >
          "
        </span>
        {item.quote}
        <span
          style={{
            color: "var(--color-accent)",
            fontSize: "1.5em",
            lineHeight: 0.7,
            verticalAlign: "bottom",
            marginLeft: 4,
          }}
        >
          "
        </span>
      </div>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--color-accent)",
        }}
      >
        {item.director}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontStyle: "italic",
          fontSize: 14,
          color: "var(--color-text-soft)",
          marginTop: 4,
        }}
      >
        {item.source}
      </div>
    </div>
  );
}
