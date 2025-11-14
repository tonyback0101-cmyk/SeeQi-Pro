import zh from "../../../locales/zh/privacy.json";
import en from "../../../locales/en/privacy.json";

type Locale = "zh" | "en";

type PageProps = {
  params: { locale: Locale };
};

const translations: Record<Locale, typeof zh> = {
  zh,
  en,
};

export default function PrivacyPage({ params }: PageProps) {
  const locale = params.locale === "en" ? "en" : "zh";
  const t = translations[locale];

  return (
    <main className="page">
      <header className="header">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <span>{t.updatedAt}</span>
      </header>

      <section className="card">
        <h2>{t.sections.health.title}</h2>
        <ul>
          {t.sections.health.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{t.sections.data.title}</h2>
        <p>{t.sections.data.description}</p>
        <ul>
          {t.sections.data.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{t.sections.usage.title}</h2>
        <p>{t.sections.usage.description}</p>
      </section>

      <section className="card">
        <h2>{t.sections.rights.title}</h2>
        <ul>
          {t.sections.rights.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>{t.sections.contact.title}</h2>
        <p>{t.sections.contact.description}</p>
      </section>

      <style jsx>{`
        .page {
          max-width: 980px;
          margin: 0 auto;
          padding: 4rem 1.5rem 5rem;
          display: flex;
          flex-direction: column;
          gap: 1.8rem;
          color: #2c3e30;
        }

        .header {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          text-align: center;
        }

        .header h1 {
          margin: 0;
          font-size: clamp(2rem, 3.2vw, 2.6rem);
        }

        .header p {
          margin: 0;
          color: rgba(72, 66, 53, 0.7);
          line-height: 1.6;
        }

        .header span {
          color: rgba(72, 66, 53, 0.6);
          font-size: 0.9rem;
        }

        .card {
          background: rgba(255, 255, 255, 0.94);
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 20px 38px rgba(45, 64, 51, 0.12);
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          line-height: 1.65;
        }

        .card h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #234035;
        }

        .card ul {
          margin: 0;
          padding-left: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .card p {
          margin: 0;
          color: rgba(72, 66, 53, 0.78);
        }

        @media (max-width: 640px) {
          .card {
            padding: 1.6rem 1.4rem;
          }
        }
      `}</style>
    </main>
  );
}

