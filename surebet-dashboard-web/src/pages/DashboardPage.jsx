import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardPage() {
  const [overview, setOverview] = useState(null);
  const [porOperador, setPorOperador] = useState([]);
  const [lucroPorDia, setLucroPorDia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // filtros
  const [preset, setPreset] = useState("daily"); // daily | 7d | monthly | custom
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // calcula o range baseado no preset
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
      past.setDate(past.getDate() - 6); // últimos 7 dias incluindo hoje
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

    // custom não mexe nas datas (usuário escolhe)
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
        throw new Error(body.error || "Erro ao carregar dashboard");
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

  // carrega primeira vez (diário)
  useEffect(() => {
    loadDashboard({ presetOverride: "daily" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // lucro acumulado para exibir evolução
  const lucroAcumulado = useMemo(() => {
    let acc = 0;
    return lucroPorDia.map((d) => {
      acc += d.lucro;
      return { ...d, acumulado: acc };
    });
  }, [lucroPorDia]);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Dashboard Geral de Surebet</h1>

      {/* filtros de período */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          background: "#f8f9fb",
        }}
      >
        <div style={{ marginBottom: 8, fontWeight: "bold" }}>Período</div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
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
                if (p.id === "custom") {
                  // no custom, só aplica quando clicar em "Aplicar"
                  return;
                }
                loadDashboard({ presetOverride: p.id });
              }}
              style={{
                padding: "6px 12px",
                cursor: "pointer",
                borderRadius: 16,
                border: preset === p.id ? "2px solid #007bff" : "1px solid #ccc",
                background: preset === p.id ? "#e7f1ff" : "#fff",
                fontSize: 13,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <div>
            <label style={{ fontSize: 14 }}>
              De:
              <br />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={preset !== "custom"}
                style={{ padding: 6 }}
              />
            </label>
          </div>

          <div>
            <label style={{ fontSize: 14 }}>
              Até:
              <br />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={preset !== "custom"}
                style={{ padding: 6 }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              if (preset === "custom") {
                loadDashboard({ presetOverride: "custom" });
              } else {
                loadDashboard({ presetOverride: preset });
              }
            }}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Aplicar
          </button>
        </div>
      </section>

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      {loading && <p>Carregando dados...</p>}

      {!loading && overview && (
        <>
          {/* KPIs principais - geral do período */}
          <section style={{ marginBottom: 24 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <KpiCard
                title="Total de operações"
                value={overview.totalApostas}
              />
              <KpiCard
                title="Lucro no período"
                value={`R$ ${overview.totalLucro.toFixed(2)}`}
              />
              <KpiCard
                title="Taxa de Greens"
                value={`${overview.greenPercent.toFixed(1)} %`}
              />
              <KpiCard
                title="Yield do período"
                value={`${overview.yieldPercent.toFixed(2)} %`}
              />
            </div>
          </section>

          {/* Evolução do lucro (tabela simples com acumulado) */}
          <section style={{ marginBottom: 24 }}>
            <h2>Evolução do lucro (acumulado)</h2>
            {lucroAcumulado.length === 0 ? (
              <p>Sem dados.</p>
            ) : (
              <table
                width="100%"
                border="1"
                cellPadding="6"
                style={{ borderCollapse: "collapse", fontSize: 14 }}
              >
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Lucro do dia</th>
                    <th>Lucro acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {lucroAcumulado.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td>R$ {d.lucro.toFixed(2)}</td>
                      <td>R$ {d.acumulado.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Seção Operadores (geral no período) */}
          <section style={{ marginBottom: 24 }}>
            <h2>Operadores no período</h2>
            {porOperador.length === 0 ? (
              <p>Sem dados.</p>
            ) : (
              <table
                width="100%"
                border="1"
                cellPadding="6"
                style={{ borderCollapse: "collapse", fontSize: 14 }}
              >
                <thead>
                  <tr>
                    <th>Operador</th>
                    <th>Operações</th>
                    <th>Stake total</th>
                    <th>Lucro</th>
                    <th>Yield (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {porOperador
                    .slice()
                    .sort((a, b) => b.lucro - a.lucro)
                    .map((o) => (
                      <tr
                        key={o.operador}
                        style={{
                          backgroundColor: o.lucro < 0 ? "#ffecec" : "transparent",
                        }}
                      >
                        <td>{o.operador}</td>
                        <td>{o.entradas}</td>
                        <td>R$ {o.stake_total.toFixed(2)}</td>
                        <td>R$ {o.lucro.toFixed(2)}</td>
                        <td>{o.yield_percent.toFixed(2)} %</td>
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

function KpiCard({ title, value }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 6,
        padding: 12,
        background: "#fdfdfd",
      }}
    >
      <div style={{ fontSize: 12, color: "#555", marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}
