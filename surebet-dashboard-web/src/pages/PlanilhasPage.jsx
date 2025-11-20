import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function PlanilhasPage() {
  const [sheets, setSheets] = useState([]);
  const [name, setName] = useState("");
  const [googleSheetId, setGoogleSheetId] = useState("");
  const [range, setRange] = useState("A1:Z1000");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  async function loadSheets() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/sheets`);
      const data = await res.json();
      setSheets(data);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar planilhas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSheets();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !googleSheetId) {
      setError("Nome e ID da planilha são obrigatórios");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/sheets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, googleSheetId, range }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao cadastrar planilha");
      }

      const created = await res.json();
      setSheets((prev) => [created, ...prev]);
      setName("");
      setGoogleSheetId("");
      setSuccess("Planilha cadastrada com sucesso!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Tem certeza que deseja remover esta planilha?")) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const res = await fetch(`${API_URL}/api/sheets/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Erro ao remover planilha");
      }

      // remove da lista local
      setSheets((prev) => prev.filter((s) => s.id !== id));
      setSuccess("Planilha removida com sucesso!");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Planilhas de Surebet</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Nome da planilha (apelido):<br />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Reídson - Gerente"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            ID do Google Sheets:<br />
            <input
              type="text"
              value={googleSheetId}
              onChange={(e) => setGoogleSheetId(e.target.value)}
              placeholder="Trecho entre /d/ e /edit"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Range (aba!intervalo):<br />
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="NOVEMBRO!A1:Z1000"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <button type="submit" style={{ padding: "8px 16px", cursor: "pointer" }}>
          Salvar planilha
        </button>
      </form>

      {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 8 }}>{success}</div>}

      <h2>Planilhas cadastradas</h2>
      {loading && <p>Carregando...</p>}
      {!loading && sheets.length === 0 && <p>Nenhuma planilha cadastrada ainda.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {sheets.map((s) => (
          <li
            key={s.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 12,
              marginBottom: 8,
              background: "#fafafa",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <strong>{s.name}</strong>
              <br />
              <small>ID: {s.google_sheet_id}</small>
              <br />
              <small>Range: {s.range}</small>
              <br />
              <small>Cadastrada em: {s.created_at}</small>
            </div>

            <button
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              style={{
                padding: "6px 12px",
                cursor: deletingId === s.id ? "default" : "pointer",
                background: "#f44336",
                border: "none",
                color: "#fff",
                borderRadius: 4,
                minWidth: 90,
              }}
            >
              {deletingId === s.id ? "Removendo..." : "Remover"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
