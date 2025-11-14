"use client";

interface Expert {
  id?: string;
  name: string;
  title?: string;
  avatar: string;
  bio?: string;
}

interface ExpertsSectionProps {
  experts: Expert[];
}

export default function ExpertsSection({ experts }: ExpertsSectionProps) {
  if (!experts?.length) return null;

  const display = experts.slice(0, 4);

  return (
    <section className="experts">
      <header className="experts__header">
        <h2>专家在线</h2>
        <p>SeeQi 顾问团队为你提供东方调理建议</p>
      </header>
      <div className="experts__grid">
        {display.map((expert, index) => (
          <div key={expert.id ?? `${expert.name}-${index}`} className="experts__card">
            <img src={expert.avatar} alt={expert.name} loading="lazy" />
            <p className="experts__name">{expert.name}</p>
            {expert.title ? <p className="experts__title">{expert.title}</p> : null}
          </div>
        ))}
      </div>
      <style jsx>{`
        .experts {
          margin: 2rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .experts__header {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .experts__header h2 {
          margin: 0;
          font-size: 1.45rem;
          color: #0f172a;
        }
        .experts__header p {
          margin: 0;
          color: rgba(15, 23, 42, 0.55);
          font-size: 0.88rem;
        }
        .experts__grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 0.55rem;
        }
        .experts__card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          padding: 0.7rem 0.5rem;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(16, 185, 129, 0.18);
        }
        .experts__card img {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          border-radius: 12px;
        }
        .experts__name {
          margin: 0;
          font-weight: 600;
          font-size: 0.86rem;
          color: #0f172a;
          text-align: center;
        }
        .experts__title {
          margin: 0;
          font-size: 0.72rem;
          color: rgba(15, 23, 42, 0.48);
          text-align: center;
        }
        @media (max-width: 640px) {
          .experts {
            margin: 1.6rem 0;
          }
          .experts__name {
            font-size: 0.82rem;
          }
          .experts__title {
            font-size: 0.68rem;
          }
        }
      `}</style>
    </section>
  );
}
