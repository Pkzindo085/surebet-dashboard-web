// src/pages/DashboardGeralPage.jsx
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardGeralPage() {
  const [overview, setOverview] = useState(null);
  const [porOperador, setPorOperador] = useState([]);
  const [lucroPorDia, setLucroPorDia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // filtros
  const [preset, setPreset] = useState("daily");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  function calcRangeFromPreset(newPreset) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (newPreset === "daily") {
      return { from: todayStr, to: todayStr };
    }

    if (newPreset === "7d") {
      const past = new Date(today);
      past.setDate(past.getDate() - 6);
      const yyyyP = past.getFullYear();
      const mmP = String(past.getMonth() + 1).padStart(2, "0");
      const ddP = String(past.getDate()).padStart(2, "0");
      const fromStr = `${yyyyP}-${mmP}-${ddP}`;
      return { from: fromStr, to: todayStr };
    }

    if (newPreset === "monthly") {
      const firstDay = `${yyyy}-${mm}-01`;
      return { from: firstDay, to: todayStr };
    }

    return { from: fromDate, to: toDate };
  }

  async function loadDashboard(options = {}) {
    const { presetOverride } = options;
    const effectivePreset = presetOverride || preset;

    let range;
    if (effectivePreset === "custom") {
      range = { from: fromDate || "", to: toDate || "" };
    } else {
      range = calcRangeFromPreset(effectivePreset);
      setFromDate(range.from);
      setToDate(range.to);
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);

      const res = await fetch(
        `${API_URL}/api/dashboard/overview-all?${params.toString()}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao carregar dashboard geral");
      }
      const data = await res.json();
      setOverview(data.overview);
      setPorOperador(data.porOperador || []);
      setLucroPorDia(data.lucroPorDia || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshClick() {
    try {
      setRefreshing(true);
      setError("");

      const res = await fetch(`${API_URL}/api/dashboard/refresh-sheets`, {
        method: "POST",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao atualizar dados");
      }

      await loadDashboard({ presetOverride: preset });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard({ presetOverride: "daily" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lucroAcumulado = useMemo(() => {
    let acc = 0;
    return lucroPorDia.map((d) => {
      acc += d.lucro;
      return { ...d, acumulado: acc };
    });
  }, [lucroPorDia]);

  // 🔹 Quantidade de dias no período (inclusivo) para cálculo do lucro médio
  const diasNoPeriodo = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
    const diffMs = to.getTime() - from.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : null;
  }, [fromDate, toDate]);

  const lucroMedioDia =
    overview && diasNoPeriodo ? overview.totalLucro / diasNoPeriodo : null;

  return (
    <div className="page-container">
      <div className="header-row">
        <h1 className="page-title">Dashboard Geral</h1>

        <button
          type="button"
          className="btn-primary"
          onClick={handleRefreshClick}
          disabled={refreshing || loading}
        >
          {refreshing ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      <p className="page-subtitle">
        Visão consolidada de todas as planilhas / operadores.
      </p>

      {/* FILTROS */}
      <section className="card card--soft filters-card">
        <div className="filters-header">Período</div>

        <div className="pill-group">
          {[
            { id: "daily", label: "Diário" },
            { id: "7d", label: "Últimos 7 dias" },
            { id: "monthly", label: "Mensal" },
            { id: "custom", label: "Personalizado" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPreset(p.id);
                if (p.id === "custom") return;
                loadDashboard({ presetOverride: p.id });
              }}
              className={
                "pill-button " + (preset === p.id ? "pill-button-active" : "")
              }
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="filters-row">
          <div>
            <label className="input-label">
              De:
              <br />
              <input
                type="date"
                className="input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={preset !== "custom"}
              />
            </label>
          </div>

          <div>
            <label className="input-label">
              Até:
              <br />
              <input
                type="date"
                className="input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={preset !== "custom"}
              />
            </label>
          </div>

          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              loadDashboard({
                presetOverride: preset === "custom" ? "custom" : preset,
              });
            }}
          >
            Aplicar
          </button>
        </div>
      </section>

      {error && <div className="text-error">{error}</div>}
      {loading && <p className="loading-text">Carregando dados...</p>}

      {!loading && overview && (
        <>
          {/* KPIs principais */}
          <section>
            <div className="kpi-grid">
              <KpiCard
                title="Total de Entradas"
                value={overview.totalApostas}
                chip="Número de entradas no período."
              />
              <KpiCard
                title="Lucro no período"
                value={`R$ ${overview.totalLucro.toFixed(2)}`}
                chip="Resultado consolidado."
              />
              <KpiCard
                title="Taxa de Greens"
                value={`${overview.greenPercent.toFixed(1)} %`}
                chip="Proporção de entradas lucrativas."
              />
              <KpiCard
                title="Yield"
                value={`${overview.yieldPercent.toFixed(2)} %`}
                chip="Lucro / Stake total."
              />
              <KpiCard
                title="Lucro médio por dia"
                value={
                  lucroMedioDia !== null
                    ? `R$ ${lucroMedioDia.toFixed(2)}`
                    : "--"
                }
                chip={
                  diasNoPeriodo
                    ? `Lucro total dividido por ${diasNoPeriodo} dia(s) do período.`
                    : "Defina um período para calcular."
                }
              />
            </div>
          </section>

          {/* Evolução do lucro - GRÁFICO + tabela */}
          <section className="card table-card">
            <h2 className="page-subtitle" style={{ marginBottom: 10 }}>
              Evolução do lucro (acumulado)
            </h2>

            <LucroChart data={lucroAcumulado} />

           {lucroAcumulado.length === 0 ? (
  <p className="text-muted" style={{ marginTop: 16 }}>
    Sem dados para o período.
  </p>
) : (
  <table className="table" style={{ marginTop: 16 }}>
    <thead>
      <tr>
        <th>Data</th>
        <th className="text-right">Lucro do dia</th>
      </tr>
    </thead>
    <tbody>
      {lucroAcumulado.map((d) => (
        <tr key={d.date}>
          <td>{d.date}</td>
          <td className="text-right">
            R$ {d.lucro.toFixed(2)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

          </section>

          {/* Operadores */}
          <section className="card table-card">
            <h2 className="page-subtitle" style={{ marginBottom: 10 }}>
              Operadores no período
            </h2>
            {porOperador.length === 0 ? (
              <p className="text-muted">Nenhum registro.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Operador</th>
                    <th>Ops</th>
                    <th className="text-right">Stake total</th>
                    <th className="text-right">Lucro</th>
                    <th className="text-right">Yield (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {porOperador
                    .slice()
                    .sort((a, b) => b.lucro - a.lucro)
                    .map((o) => (
                      <tr
                        key={o.operador}
                        className={o.lucro < 0 ? "row-negative" : ""}
                      >
                        <td>{o.operador}</td>
                        <td>{o.entradas}</td>
                        <td className="text-right">
                          R$ {o.stake_total.toFixed(2)}
                        </td>
                        <td className="text-right">
                          R$ {o.lucro.toFixed(2)}
                        </td>
                        <td className="text-right">
                          {o.yield_percent.toFixed(2)} %
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value, chip }) {
  return (
    <div className="card">
      <div className="kpi-card-title">{title}</div>
      <div className="kpi-card-value">{value}</div>
      {chip && <div className="kpi-chip">{chip}</div>}
    </div>
  );
}

/**
 * Gráfico de linha com tooltip (data + acumulado)
 */
function LucroChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return <p className="text-muted">Sem dados para exibir o gráfico.</p>;
  }

  const width = 800;
  const height = 260;
  const paddingX = 48;
  const paddingY = 32;

  const minY = Math.min(...data.map((d) => d.acumulado));
  const maxY = Math.max(...data.map((d) => d.acumulado));
  const rangeY = maxY - minY || 1;

  const count = data.length;
  const stepX = count > 1 ? (width - paddingX * 2) / (count - 1) : 0;

  const getPoint = (d, i) => {
    const x = paddingX + stepX * i;
    const norm = (d.acumulado - minY) / rangeY;
    const y =
      paddingY + (1 - norm) * (height - paddingY * 2);
    return { x, y };
  };

  const points = data
    .map((d, i) => {
      const { x, y } = getPoint(d, i);
      return `${x},${y}`;
    })
    .join(" ");

  const tickIndexes = [0, Math.floor((count - 1) / 2), count - 1].filter(
    (v, i, arr) => v >= 0 && arr.indexOf(v) === i
  );

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    let idx = stepX === 0 ? 0 : Math.round((clientX - paddingX) / stepX);
    if (idx < 0) idx = 0;
    if (idx > count - 1) idx = count - 1;

    setHoverIndex(idx);
  }

  return (
    <div
      className="lucro-chart-wrapper"
      style={{ width: "100%", maxWidth: "100%", marginTop: 8 }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 260, display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        {/* fundo */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(15,23,42,0.85)"
          rx="12"
        />

        {/* eixos */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="rgba(148,163,184,0.6)"
          strokeWidth="1"
        />
        <line
          x1={paddingX}
          y1={paddingY}
          x2={paddingX}
          y2={height - paddingY}
          stroke="rgba(148,163,184,0.6)"
          strokeWidth="1"
        />

        {/* linha principal */}
        <polyline
          fill="none"
          stroke="#22c55e"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />

        {/* área sob a linha */}
        <path
          d={`${`M ${points.split(" ")[0]}`} ${points} L ${
            paddingX + stepX * (count - 1)
          } ${height - paddingY} L ${paddingX} ${height - paddingY} Z`}
          fill="rgba(34,197,94,0.18)"
        />

        {/* pontos */}
        {data.map((d, i) => {
          const { x, y } = getPoint(d, i);
          return <circle key={d.date} cx={x} cy={y} r="3.2" fill="#22c55e" />;
        })}

        {/* tooltip */}
        {hoverIndex !== null && (() => {
          const d = data[hoverIndex];
          const { x, y } = getPoint(d, hoverIndex);

          const tooltipWidth = 150;
          const tooltipHeight = 40;
          const tx = Math.min(
            Math.max(x + 8, paddingX),
            width - paddingX - tooltipWidth
          );
          const ty =
            y - tooltipHeight - 8 < paddingY
              ? y + 16
              : y - tooltipHeight - 8;

          return (
            <g>
              {/* linha vertical */}
              <line
                x1={x}
                y1={paddingY}
                x2={x}
                y2={height - paddingY}
                stroke="rgba(148,163,184,0.4)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* ponto destacado */}
              <circle cx={x} cy={y} r="5" fill="#22c55e" />

              {/* caixinha */}
              <rect
                x={tx}
                y={ty}
                width={tooltipWidth}
                height={tooltipHeight}
                rx="8"
                ry="8"
                fill="rgba(15,23,42,0.95)"
                stroke="#22c55e"
                strokeWidth="0.8"
              />
              <text
                x={tx + 8}
                y={ty + 15}
                fontSize="11"
                fill="#e5e7eb"
              >
                {d.date}
              </text>
              <text
                x={tx + 8}
                y={ty + 30}
                fontSize="11"
                fill="#a5b4fc"
              >
                {`Acumulado: R$ ${d.acumulado.toFixed(2)}`}
              </text>
            </g>
          );
        })()}

        {/* labels min/max */}
        <text
          x={paddingX - 8}
          y={height - paddingY}
          textAnchor="end"
          fontSize="10"
          fill="rgba(148,163,184,0.9)"
        >
          R$ {minY.toFixed(2)}
        </text>
        <text
          x={paddingX - 8}
          y={paddingY + 4}
          textAnchor="end"
          fontSize="10"
          fill="rgba(148,163,184,0.9)"
        >
          R$ {maxY.toFixed(2)}
        </text>

        {/* labels de datas (primeira, meio, última) */}
        {tickIndexes.map((idx) => {
          const d = data[idx];
          const { x } = getPoint(d, idx);
          const y = height - paddingY + 18;
          return (
            <text
              key={d.date}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(148,163,184,0.9)"
            >
              {d.date}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
