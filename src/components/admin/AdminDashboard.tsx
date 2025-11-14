'use client';

import { useEffect, useMemo, useState } from "react";

type EmailJob = {
  id: string;
  email_to: string;
  status: string;
  attempts: number;
  created_at: string;
  processed_at: string | null;
  last_error: string | null;
  summary: unknown;
};

const DEFAULT_KEYS = [
  "dream.samples",
  "collection.guides",
  "share.templates",
  "analysis.overrides",
];

type AdminDashboardProps = {
  adminEmail: string;
};

type SettingsMap = Record<string, unknown>;

type SaveState = {
  key: string;
  status: "idle" | "saving" | "success" | "error";
  message?: string;
};

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function parseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error((error as Error).message || "Invalid JSON");
  }
}

export default function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [rawValues, setRawValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({});
  const [queue, setQueue] = useState<EmailJob[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueMessage, setQueueMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/admin/settings")
      .then(async (response) => (response.ok ? response.json() : Promise.reject(await response.json())))
      .then((data) => {
        if (!mounted) return;
        const map: SettingsMap = data?.settings ?? {};
        setSettings(map);
        const raw: Record<string, string> = {};
        DEFAULT_KEYS.forEach((key) => {
          raw[key] = pretty(map[key]);
        });
        setRawValues(raw);
      })
      .catch((error) => {
        console.error("admin-settings", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const loadQueue = async () => {
    setQueueLoading(true);
    try {
      const response = await fetch("/api/admin/reports/email/queue");
      const data = await response.json();
      setQueue(data?.queue ?? []);
    } catch (error) {
      console.error("admin-email-queue", error);
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const triggerProcess = async () => {
    setQueueLoading(true);
    setQueueMessage(null);
    try {
      const response = await fetch("/api/admin/reports/email/process", { method: "POST" });
      const data = await response.json();
      setQueueMessage(
        response.ok
          ? `Processed ${data?.processed ?? 0} job(s).`
          : data?.error || "Processing failed"
      );
      await loadQueue();
    } catch (error) {
      console.error("admin-email-process", error);
      setQueueMessage("Processing failed");
    } finally {
      setQueueLoading(false);
    }
  };

  const saveSetting = async (key: string) => {
    const text = rawValues[key] ?? "{}";
    let parsed: unknown;
    try {
      parsed = parseJSON(text);
      setErrors((prev) => ({ ...prev, [key]: null }));
    } catch (error) {
      setErrors((prev) => ({ ...prev, [key]: (error as Error).message }));
      return;
    }

    setSaveStates((prev) => ({ ...prev, [key]: { key, status: "saving" } }));
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: parsed }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Save failed");
      }
      setSettings((prev) => ({ ...prev, [key]: parsed }));
      setSaveStates((prev) => ({ ...prev, [key]: { key, status: "success" } }));
      setTimeout(() => {
        setSaveStates((prev) => ({ ...prev, [key]: { key, status: "idle" } }));
      }, 2000);
    } catch (error) {
      console.error("save-setting", error);
      setSaveStates((prev) => ({
        ...prev,
        [key]: { key, status: "error", message: (error as Error).message },
      }));
    }
  };

  const cards = useMemo(() => DEFAULT_KEYS, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header">
          <h1>SeeQi Admin</h1>
          <p>{adminEmail}</p>
        </div>
        <p>Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>SeeQi Admin</h1>
          <p>Logged in as {adminEmail}</p>
        </div>
        <span className="admin-tag">Beta</span>
      </div>

      <p className="admin-tip">
        设置保存后会立即写入 Supabase，可用于生成分享模板、采集指引、示例数据等内容。前端页面将逐步接入这些配置。
      </p>

      <div className="cards">
        {cards.map((key) => {
          const saveState = saveStates[key]?.status ?? "idle";
          const errorMsg = errors[key];
          return (
            <section key={key} className="card">
              <header>
                <h2>{key}</h2>
                <button type="button" onClick={() => saveSetting(key)} disabled={saveState === "saving"}>
                  {saveState === "saving" ? "Saving…" : "Save"}
                </button>
              </header>
              <textarea
                value={rawValues[key] ?? "{}"}
                onChange={(event) => setRawValues((prev) => ({ ...prev, [key]: event.target.value }))}
                spellCheck={false}
              />
              {errorMsg && <p className="error">{errorMsg}</p>}
              {saveState === "success" && <p className="success">Saved ✓</p>}
              {saveState === "error" && <p className="error">{saveStates[key]?.message || "Save failed"}</p>}
            </section>
          );
        })}
      </div>

      <section className="queue">
        <header>
          <div>
            <h2>Report email queue</h2>
            <p>Pending emails waiting to be dispatched.</p>
          </div>
          <button type="button" onClick={triggerProcess} disabled={queueLoading}>
            {queueLoading ? "Processing…" : "Process 10"}
          </button>
        </header>
        {queueMessage && <p className="info">{queueMessage}</p>}
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created</th>
              <th>Processed</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {queue.map((job) => (
              <tr key={job.id}>
                <td>{job.email_to}</td>
                <td>{job.status}</td>
                <td>{job.attempts}</td>
                <td>{new Date(job.created_at).toLocaleString()}</td>
                <td>{job.processed_at ? new Date(job.processed_at).toLocaleString() : "—"}</td>
                <td>{job.last_error ?? ""}</td>
              </tr>
            ))}
            {!queue.length && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "1rem" }}>
                  {queueLoading ? "Loading…" : "No queued emails"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <style jsx>{`
        .admin-page {
          max-width: 980px;
          margin: 0 auto;
          padding: 2.5rem 1.5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .admin-header h1 {
          margin: 0;
          font-size: 2rem;
          color: #234035;
        }

        .admin-header p {
          margin: 0.3rem 0 0;
          color: rgba(35, 64, 53, 0.65);
        }

        .admin-tag {
          padding: 0.35rem 0.8rem;
          border-radius: 999px;
          background: rgba(35, 64, 53, 0.1);
          color: #234035;
          font-weight: 600;
        }

        .admin-tip {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.6;
          color: rgba(35, 64, 53, 0.75);
        }

        .cards {
          display: grid;
          gap: 1.5rem;
        }

        .card {
          border-radius: 20px;
          border: 1px solid rgba(141, 174, 146, 0.3);
          background: rgba(255, 255, 255, 0.95);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          box-shadow: 0 16px 32px rgba(35, 64, 53, 0.08);
        }

        .card header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .card h2 {
          margin: 0;
          font-size: 1.2rem;
          color: #234035;
          word-break: break-all;
        }

        .card button {
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #2c3e30, #4a7157);
          color: #fff;
          font-weight: 600;
          padding: 0.55rem 1.3rem;
          cursor: pointer;
        }

        .card button[disabled] {
          opacity: 0.6;
          cursor: default;
        }

        textarea {
          width: 100%;
          min-height: 220px;
          border-radius: 12px;
          border: 1px solid rgba(35, 64, 53, 0.2);
          padding: 1rem;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.98);
          color: #1f3329;
          resize: vertical;
        }

        .error {
          margin: 0;
          color: #b91c1c;
          font-size: 0.9rem;
        }

        .success {
          margin: 0;
          color: #047857;
          font-size: 0.9rem;
        }

        .queue {
          border-radius: 20px;
          border: 1px solid rgba(141, 174, 146, 0.3);
          background: rgba(255, 255, 255, 0.95);
          padding: 1.5rem;
          box-shadow: 0 16px 32px rgba(35, 64, 53, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .queue header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .queue header button {
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #2c3e30, #4a7157);
          color: #fff;
          font-weight: 600;
          padding: 0.55rem 1.3rem;
          cursor: pointer;
        }

        .queue header button[disabled] {
          opacity: 0.6;
          cursor: default;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        th,
        td {
          border-bottom: 1px solid rgba(141, 174, 146, 0.2);
          padding: 0.75rem 0.6rem;
          text-align: left;
        }

        th {
          font-weight: 600;
          color: #234035;
        }

        .info {
          margin: 0;
          color: #1d4ed8;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
