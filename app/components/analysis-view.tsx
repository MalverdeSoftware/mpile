"use client";
import { useMemo, useState } from "react";
import Banner from "@jetbrains/ring-ui-built/components/banner/banner";
import { H2 } from "@jetbrains/ring-ui-built/components/heading/heading";
import Input, { Size } from "@jetbrains/ring-ui-built/components/input/input";
import { Tab, Tabs } from "@jetbrains/ring-ui-built/components/tabs/tabs";
import {
  pairwise,
  averageLinkage,
  type Cluster,
  type Pair,
} from "@/lib/analysis";
import type { SortResponse, Card } from "@/lib/model";
// Shades of Ring's blue. The text flips to white once that gives the better contrast.
const cellStyle = (similarity: number) => ({
  background: `rgba(var(--ring-main-hover-components), ${0.08 + similarity * 0.85})`,
  color: similarity > 0.85 ? "white" : "var(--ring-text-color)",
});

// `cards` are the shared cards: the analysis compares those only, never cards a participant added.
export default function AnalysisView({
  cards,
  responses,
}: {
  cards: Card[];
  responses: SortResponse[];
}) {
  const pairs = useMemo(() => pairwise(cards, responses), [cards, responses]);
  const tree = useMemo(() => averageLinkage(cards, pairs), [cards, pairs]);
  const [tab, setTab] = useState("matrix"),
    [threshold, setThreshold] = useState(50),
    [minimum, setMinimum] = useState(1);
  const eligible = responses.filter((r) => r.status === "submitted");
  if (!eligible.length)
    return (
      <section className="panel stack">
        <H2>Patterns will appear here</H2>
        <p>
          Analysis uses submitted sorts. Drafts are kept separately.
        </p>
      </section>
    );
  if (cards.length < 2)
    return (
      <section className="panel stack">
        <H2>No shared-card comparison yet</H2>
        <p>
          This activity has fewer than two shared cards, so there are no pairs
          to compare. The exports still hold every participant’s groupings.
        </p>
      </section>
    );
  const known = pairs.filter((p) => p.compared > 0).length;
  return (
    <>
      <div className="metric-grid">
        <div>
          <span>Submitted sorts</span>
          <strong>{eligible.length}</strong>
        </div>
        <div>
          <span>Shared cards</span>
          <strong>{cards.length}</strong>
        </div>
        <div>
          <span>Pairs with observations</span>
          <strong>
            {known}
            <small> / {pairs.length}</small>
          </strong>
        </div>
      </div>
      <Banner mode="info" withIcon>
        Similarity = times a pair was put together ÷ responses placing both
        cards into piles. Unsorted cards are excluded from that pair’s
        denominator. Cards a participant added are kept in the exports but do
        not enter this shared-card analysis.
      </Banner>
      <Tabs selected={tab} onSelect={setTab}>
        <Tab id="matrix" title="Co-sorting matrix">
          <section className="analysis-section stack">
            <H2>Which cards belong together?</H2>
            <p className="secondary-text">
              Darker cells indicate more frequent co-sorting. Each cell shows
              the percentage and the number of comparable responses. “—” means
              no comparable responses, not zero similarity.
            </p>
            <div className="table-scroll">
              <table className="matrix">
                <thead>
                  <tr>
                    <th>Card</th>
                    {cards.map((c, i) => (
                      <th key={c.id} title={c.text}>
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cards.map((c, i) => (
                    <tr key={c.id}>
                      <th>
                        {i + 1}. {c.text}
                      </th>
                      {cards.map((d, j) => {
                        const p = pairs.find(
                          (p) =>
                            (p.a === c.id && p.b === d.id) ||
                            (p.b === c.id && p.a === d.id),
                        );
                        return (
                          <td
                            key={d.id}
                            className={i === j ? "matrix__self" : undefined}
                            style={
                              i !== j && p?.similarity != null
                                ? cellStyle(p.similarity)
                                : undefined
                            }
                            title={
                              p
                                ? `${c.text} / ${d.text}: ${p.together} together, ${p.compared} comparable, ${p.exposed} submitted sorts`
                                : c.text
                            }
                          >
                            {i === j ? (
                              "·"
                            ) : p?.similarity == null ? (
                              "—"
                            ) : (
                              <>
                                {Math.round(p.similarity * 100)}%
                                <small>n={p.compared}</small>
                              </>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Tab>
        <Tab id="network" title="Connection map">
          <section className="analysis-section stack">
            <H2>Connections across the card set</H2>
            <div className="map-controls">
              <label>
                Show connections at {threshold}% similarity or higher
                <input
                  type="range"
                  aria-label="Minimum connection similarity"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  min={0}
                  max={100}
                  step={5}
                />
              </label>
              <Input
                type="number"
                size={Size.M}
                label="Minimum comparable responses"
                min={1}
                max={eligible.length}
                value={minimum}
                onChange={(e) => setMinimum(Math.max(1, Number(e.target.value)))}
              />
            </div>
            <p className="secondary-text">
              Line thickness represents similarity. Cards are arranged around a
              circle for readability; distance and position have no statistical
              meaning.
            </p>
            <Network
              cards={cards}
              pairs={pairs.filter(
                (p) =>
                  p.similarity !== null &&
                  p.similarity * 100 >= threshold &&
                  p.compared >= minimum,
              )}
            />
          </section>
        </Tab>
        <Tab id="clusters" title="Clusters">
          <section className="analysis-section stack">
            <H2>Hierarchical clustering</H2>
            <p className="secondary-text">
              Average linkage using dissimilarity = 1 − co-sorting similarity.
              Branches meeting nearer 0 represent more similar card groups. This
              exploratory summary does not replace participants’ own categories.
            </p>
            {tree ? (
              <Dendrogram tree={tree} cards={cards} />
            ) : (
              <Banner mode="info" withIcon>
                Clustering needs at least one comparable response for every
                shared-card pair. Some pairs have no observations yet. Missing
                values are not replaced with zero similarity.
              </Banner>
            )}
          </section>
        </Tab>
      </Tabs>
      <details className="console-details">
        <summary>How to interpret and reconcile responses</summary>
        <p>
          Pile names are preserved exactly as participants wrote them. Two piles
          with the same name are not automatically treated as the same category.
          Similarity is based on stable card IDs and placement, independently of
          labels.
        </p>
        <p>
          Review the per-response exports alongside the matrix. Researchers can
          develop a category crosswalk separately while retaining the original
          labels. No automatic semantic merging or AI-generated sorting is
          applied.
        </p>
        <p>
          Pair-specific sample sizes may differ when participants leave cards
          unsorted. Small or unequal denominators can create unstable patterns.
          Results describe the collected responses; no significance tests or
          population claims are made.
        </p>
      </details>
    </>
  );
}
function Network({ cards, pairs }: { cards: Card[]; pairs: Pair[] }) {
  const points = cards.map((c, i) => ({
    id: c.id,
    x: 300 + 235 * Math.cos((2 * Math.PI * i) / cards.length - Math.PI / 2),
    y: 300 + 235 * Math.sin((2 * Math.PI * i) / cards.length - Math.PI / 2),
  }));
  const byId = new Map(points.map((p) => [p.id, p]));
  return (
    <div className="network-layout">
      <svg
        viewBox="0 0 600 600"
        role="img"
        aria-label={`Co-sorting network with ${cards.length} cards and ${pairs.length} connections`}
      >
        <title>Co-sorting connection map</title>
        {pairs.map((p) => {
          const a = byId.get(p.a)!,
            b = byId.get(p.b)!;
          return (
            <line
              key={p.a + p.b}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              className="chart-line"
              strokeWidth={0.5 + 3 * p.similarity!}
              opacity={0.1 + 0.6 * p.similarity!}
            >
              <title>
                {cards.find((c) => c.id === p.a)?.text} /{" "}
                {cards.find((c) => c.id === p.b)?.text}:{" "}
                {Math.round(p.similarity! * 100)}%, n={p.compared}
              </title>
            </line>
          );
        })}
        {points.map((p, i) => (
          <g key={p.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={cards.length > 40 ? 9 : 16}
              className="chart-node"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y + 4}
              textAnchor="middle"
              className="chart-node-label"
              fontSize={cards.length > 40 ? 9 : 12}
            >
              {i + 1}
            </text>
            <title>{cards[i].text}</title>
          </g>
        ))}
      </svg>
      <div>
        <p className="secondary-text">{pairs.length} connections shown</p>
        <ol className="card-legend">
          {cards.map((c) => (
            <li key={c.id}>{c.text}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}
function Dendrogram({ tree, cards }: { tree: Cluster; cards: Card[] }) {
  const order: number[] = [];
  function walk(n: Cluster) {
    if (n.left && n.right) {
      walk(n.left);
      walk(n.right);
    } else order.push(n.members[0]);
  }
  walk(tree);
  const positions = new Map(order.map((id, i) => [id, 45 + i * 30]));
  const lines: React.ReactNode[] = [];
  function draw(n: Cluster): { x: number; y: number } {
    if (!n.left || !n.right) return { x: 250, y: positions.get(n.members[0])! };
    const a = draw(n.left),
      b = draw(n.right),
      x = 250 + n.height * 500,
      y = (a.y + b.y) / 2;
    lines.push(
      <path
        key={n.id}
        d={`M${a.x},${a.y} H${x} V${b.y} H${b.x}`}
        className="chart-line"
        strokeWidth="1.5"
        fill="none"
      />,
    );
    return { x, y };
  }
  draw(tree);
  return (
    <div className="table-scroll">
      <svg
        className="dendrogram"
        viewBox={`0 0 800 ${cards.length * 30 + 80}`}
        width="800"
        height={cards.length * 30 + 80}
        role="img"
        aria-label="Average-linkage clustering dendrogram"
      >
        <title>Average-linkage dendrogram, dissimilarity from 0 to 1</title>
        {[0, 0.25, 0.5, 0.75, 1].map((d) => (
          <g key={d}>
            <line
              x1={250 + d * 500}
              y1="28"
              x2={250 + d * 500}
              y2={cards.length * 30 + 30}
              className="chart-grid"
            />
            <text
              x={250 + d * 500}
              y="18"
              textAnchor="middle"
              fontSize="12"
              className="chart-axis"
            >
              {d}
            </text>
          </g>
        ))}
        {lines}
        {order.map((idx) => (
          <text
            key={idx}
            x="240"
            y={positions.get(idx)! + 4}
            textAnchor="end"
            fontSize="13"
            className="chart-label"
          >
            <title>{cards[idx].text}</title>
            {idx + 1}.{" "}
            {cards[idx].text.length > 30
              ? cards[idx].text.slice(0, 28) + "…"
              : cards[idx].text}
          </text>
        ))}
      </svg>
      <p className="secondary-text">
        Dissimilarity increases from left (0) to right (1).
      </p>
    </div>
  );
}
