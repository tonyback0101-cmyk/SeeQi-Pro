"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DreamInput from "@/components/dream/DreamInput";
import HexagramDisplay from "@/components/iching/HexagramDisplay";
import { generateIchingReading } from "@/lib/ichingGenerator";
import type { IchingReading } from "@/lib/ichingGenerator";
import { COLORS } from "@/lib/colors";
import { analyzeDream } from "@/lib/analysis/dreamAnalyzer";

type Locale = "zh" | "en";

type PageProps = {
  params: {
    locale: Locale;
  };
};

const copy = {
  zh: {
    title: "健康数据采集",
    subtitle: "分步骤完成信息填写，让 SeeQi 为你生成专属气运健康洞察。",
    progressLabels: ["采集引导", "视觉上传", "个人信息", "梦境描述", "卦象推演", "确认提交"],
    palmLabel: "手相上传",
    tongueLabel: "舌相上传",
    captureHint: "建议光线柔和、背景整洁，并保持相机对焦清晰。",
    birthCalendar: ["公历", "农历"],
    birthDate: "出生日期",
    birthTime: "出生时辰",
    gender: "性别",
    genders: ["女", "男", "其他"],
    dreamTitle: "梦境描述",
    emotionLabel: "梦境情绪",
    emotions: ["喜悦", "恐惧", "困惑", "平静", "未知"],
    keywordsHint: "点击以下关键词快速添加：",
    hexagramTitle: "八卦占卜",
    generateHexagram: "随机生成卦象",
    privacyNote: "我已知晓并同意数据仅用于生成个性化健康洞察，且可随时删除。",
    submit: "提交并生成洞察",
    back: "返回首页",
    stepPrev: "上一步",
    stepNext: "下一步",
    preview: "当前卦象预览",
  },
  en: {
    title: "Wellness Data Collection",
    subtitle: "Complete the guided steps so SeeQi can craft your personalized fortune-health insights.",
    progressLabels: ["Intro", "Visual Upload", "Personal Info", "Dream Log", "I Ching", "Review"],
    palmLabel: "Palm Upload",
    tongueLabel: "Tongue Upload",
    captureHint: "Use soft lighting, a clean background, and ensure proper focus.",
    birthCalendar: ["Gregorian", "Lunar"],
    birthDate: "Birth Date",
    birthTime: "Birth Time",
    gender: "Gender",
    genders: ["Female", "Male", "Other"],
    dreamTitle: "Dream Description",
    emotionLabel: "Dream Emotion",
    emotions: ["Joy", "Fear", "Confusion", "Calm", "Unknown"],
    keywordsHint: "Tap keywords to insert quickly:",
    hexagramTitle: "I Ching Reading",
    generateHexagram: "Generate Hexagram",
    privacyNote: "I understand data is only used for my insights and can be deleted anytime.",
    submit: "Submit & Generate Insights",
    back: "Back to Home",
    stepPrev: "Previous",
    stepNext: "Next",
    preview: "Current Hexagram Preview",
  },
} as const;

const dreamKeywords: Record<Locale, string[]> = {
  zh: ["飞行", "坠落", "水", "追逐", "迷路", "重逢"],
  en: ["Flight", "Falling", "Water", "Chasing", "Lost", "Reunion"],
};

const timeBranches: Record<Locale, { value: string; label: string }[]> = {
  zh: [
    { value: "zi", label: "子时 (23:00-00:59)" },
    { value: "chou", label: "丑时 (01:00-02:59)" },
    { value: "yin", label: "寅时 (03:00-04:59)" },
    { value: "mao", label: "卯时 (05:00-06:59)" },
    { value: "chen", label: "辰时 (07:00-08:59)" },
    { value: "si", label: "巳时 (09:00-10:59)" },
    { value: "wu", label: "午时 (11:00-12:59)" },
    { value: "wei", label: "未时 (13:00-14:59)" },
    { value: "shen", label: "申时 (15:00-16:59)" },
    { value: "you", label: "酉时 (17:00-18:59)" },
    { value: "xu", label: "戌时 (19:00-20:59)" },
    { value: "hai", label: "亥时 (21:00-22:59)" },
  ],
  en: [
    { value: "zi", label: "Zi (11pm-1am)" },
    { value: "chou", label: "Chou (1am-3am)" },
    { value: "yin", label: "Yin (3am-5am)" },
    { value: "mao", label: "Mao (5am-7am)" },
    { value: "chen", label: "Chen (7am-9am)" },
    { value: "si", label: "Si (9am-11am)" },
    { value: "wu", label: "Wu (11am-1pm)" },
    { value: "wei", label: "Wei (1pm-3pm)" },
    { value: "shen", label: "Shen (3pm-5pm)" },
    { value: "you", label: "You (5pm-7pm)" },
    { value: "xu", label: "Xu (7pm-9pm)" },
    { value: "hai", label: "Hai (9pm-11pm)" },
  ],
};

export default function DataCollectionPage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const t = copy[locale];
  const [step, setStep] = useState(0);
  const [isLunar, setIsLunar] = useState(false);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState(timeBranches[locale][0].value);
  const [gender, setGender] = useState<string>(t.genders[0]);
  const [dreamText, setDreamText] = useState("");
  const [emotion, setEmotion] = useState<string>("unknown");
  const dreamPreview = useMemo(() => analyzeDream(dreamText, emotion, locale), [dreamText, emotion, locale]);
  const [agree, setAgree] = useState(false);
  const [palmPreview, setPalmPreview] = useState<string | null>(null);
  const [tonguePreview, setTonguePreview] = useState<string | null>(null);
  const [reading, setReading] = useState<IchingReading | null>(null);

  useEffect(() => {
    setReading(generateIchingReading({ method: "coins" }));
  }, []);

  useEffect(() => {
    return () => {
      if (palmPreview) URL.revokeObjectURL(palmPreview);
      if (tonguePreview) URL.revokeObjectURL(tonguePreview);
    };
  }, [palmPreview, tonguePreview]);

  const progress = useMemo(() => ((step + 1) / t.progressLabels.length) * 100, [step, t.progressLabels.length]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>, type: "palm" | "tongue") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (type === "palm") {
      if (palmPreview) URL.revokeObjectURL(palmPreview);
      setPalmPreview(previewUrl);
    } else {
      if (tonguePreview) URL.revokeObjectURL(tonguePreview);
      setTonguePreview(previewUrl);
    }
  };

  const handleGenerateHexagram = () => {
    setReading(generateIchingReading({ method: "coins" }));
  };

  const canSubmit = agree && dreamText.trim().length > 30;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    alert(locale === "zh" ? "数据已提交，正在生成报告……" : "Data submitted. Generating insights...");
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <section className="card">
            <h2>{t.progressLabels[0]}</h2>
            <p className="muted">
              {locale === "zh"
                ? "建议在光线充足且网络稳定的环境下完成测评，整个流程约 6-8 分钟。"
                : "Find a well-lit and stable network environment. The whole flow takes about 6–8 minutes."}
            </p>
            <ul className="list">
              <li>{locale === "zh" ? "准备好手机摄像头，确保镜头清洁。" : "Prepare your camera and ensure the lens is clean."}</li>
              <li>{locale === "zh" ? "建议使用耳机，保持环境安静，以便专注填写。" : "Use headphones and stay in a quiet space to focus."}</li>
              <li>{locale === "zh" ? "如需中途退出，可保存进度稍后继续。" : "You can save progress and resume later if needed."}</li>
            </ul>
          </section>
        );
      case 1:
        return (
          <section className="grid">
            <div className="card">
              <h3>{t.palmLabel}</h3>
              <p className="hint">{t.captureHint}</p>
              <label className="upload">
                <input type="file" accept="image/*" capture="environment" onChange={(event) => handleUpload(event, "palm")} />
                <span>{locale === "zh" ? "拍照或从相册选择" : "Capture or choose from gallery"}</span>
              </label>
              {palmPreview && <img src={palmPreview} alt="palm preview" className="preview" />}
            </div>
            <div className="card">
              <h3>{t.tongueLabel}</h3>
              <p className="hint">{t.captureHint}</p>
              <label className="upload">
                <input type="file" accept="image/*" capture="environment" onChange={(event) => handleUpload(event, "tongue")} />
                <span>{locale === "zh" ? "拍照或从相册选择" : "Capture or choose from gallery"}</span>
              </label>
              {tonguePreview && <img src={tonguePreview} alt="tongue preview" className="preview" />}
            </div>
          </section>
        );
      case 2:
        return (
          <section className="card">
            <h3>{t.progressLabels[2]}</h3>
            <div className="formRow">
              <label>{t.birthDate}</label>
              <div className="calendarToggle">
                {t.birthCalendar.map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    className={`toggle${(isLunar && idx === 1) || (!isLunar && idx === 0) ? " toggle--active" : ""}`}
                    onClick={() => setIsLunar(idx === 1)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                className="input"
              />
            </div>
            <div className="formRow">
              <label>{t.birthTime}</label>
              <select value={birthTime} onChange={(event) => setBirthTime(event.target.value)} className="input">
                {timeBranches[locale].map((time) => (
                  <option key={time.value} value={time.value}>
                    {time.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="formRow">
              <label>{t.gender}</label>
              <div className="calendarToggle">
                {t.genders.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`toggle${gender === item ? " toggle--active" : ""}`}
                    onClick={() => setGender(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>
        );
      case 3:
        return (
          <section className="card">
            <h3>{t.dreamTitle}</h3>
            <div className="formRow">
              <label className="field">
                <span>{locale === "zh" ? "梦境描述" : "Dream Narrative"}</span>
                <textarea
                  value={dreamText}
                  onChange={(event) => setDreamText(event.target.value)}
                  placeholder={
                    locale === "zh"
                      ? "请详细描述您的梦境...（例如：我梦见在森林中漫步，遇到一只白鹿）"
                      : "Please describe your dream in detail… (e.g. I wandered in a forest and met a white deer)"
                  }
                  rows={6}
                  className="textarea"
                />
                <span className="helper">
                  {locale === "zh" ? `当前字数：${dreamText.trim().length}` : `Characters: ${dreamText.trim().length}`}
                </span>
              </label>
            </div>

            <div className="emotionPicker">
              <p className="hint">{t.emotionLabel}</p>
              <div className="calendarToggle">
                {t.emotions.map((item) => {
                  const value =
                    item === "喜悦" || item === "Joy" ? "joy" :
                    item === "恐惧" || item === "Fear" ? "fear" :
                    item === "困惑" || item === "Confusion" ? "confusion" :
                    item === "平静" || item === "Calm" ? "calm" :
                    item === "愤怒" || item === "Anger" ? "anger" :
                    item === "悲伤" || item === "Sadness" ? "sadness" :
                    "unknown";
                  return (
                    <button
                      key={item}
                      type="button"
                      className={`toggle${emotion === value ? " toggle--active" : ""}`}
                      onClick={() => setEmotion(value)}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="hint">{t.keywordsHint}</p>
            <div className="chips">
              {dreamKeywords[locale].map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  className="chip"
                  onClick={() =>
                    setDreamText((prev) =>
                      `${prev}${prev.endsWith(" ") || prev.endsWith("，") || prev.length === 0 ? "" : locale === "zh" ? "，" : ", "}${keyword}`
                    )
                  }
                >
                  {keyword}
                </button>
              ))}
            </div>

            <div className="dream-preview">
              <h4>{locale === "zh" ? "实时解析预览" : "Live Preview"}</h4>
              <p>{dreamPreview.summary}</p>
              <ul>
                <li>
                  {locale === "zh" ? "关键词：" : "Keywords:"}{" "}
                  {dreamPreview.keywords.join(locale === "zh" ? "、" : ", ")}
                </li>
                <li>
                  {locale === "zh" ? "情感强度：" : "Intensity:"} {dreamPreview.intensity} / 5
                </li>
                <li>
                  {locale === "zh" ? "五行倾向：" : "Elements:"}{" "}
                  {Object.entries(dreamPreview.elements)
                    .map(([k, v]) => `${k}:${v}`)
                    .join(locale === "zh" ? "、" : ", ")}
                </li>
              </ul>
              <p>{dreamPreview.interpretation}</p>
              <h5>{locale === "zh" ? "建议：" : "Advice"}</h5>
              <ul>
                {dreamPreview.advice.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        );
      case 4:
        return (
          <section className="card">
            <h3>{t.hexagramTitle}</h3>
            <button type="button" className="primary" onClick={handleGenerateHexagram}>
              {t.generateHexagram}
            </button>
            <p className="hint">{t.preview}</p>
            {reading ? (
              <HexagramDisplay
                baseHexagram={reading.baseHexagram}
                changingHexagram={reading.changingHexagram}
                lines={reading.lines}
                locale={locale}
              />
            ) : (
              <p className="muted">{locale === "zh" ? "点击按钮生成卦象" : "Tap the button to generate a hexagram."}</p>
            )}
          </section>
        );
      case 5:
        return (
          <section className="card">
            <h3>{t.progressLabels[5]}</h3>
            <ul className="list">
              <li>{locale === "zh" ? "请再次确认信息准确，提交后约 30 秒即可获得报告。" : "Review details before submitting. Insights will be ready in ~30 seconds."}</li>
              <li>{locale === "zh" ? "提交即代表同意我们对数据的加密存储与服务条款。" : "Submission confirms encrypted storage and service terms."}</li>
              <li>{locale === "zh" ? "如需协助，可随时联系在线顾问。" : "Need help? Contact an advisor anytime."}</li>
            </ul>
            <label className="agreement">
              <input type="checkbox" checked={agree} onChange={(event) => setAgree(event.target.checked)} />
              <span>{t.privacyNote}</span>
            </label>
            <button type="submit" className="primary" disabled={!canSubmit}>
              {t.submit}
            </button>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        maxWidth: "1024px",
        margin: "0 auto",
        padding: "2.5rem 1.5rem 4rem",
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
      }}
    >
      <header className="hero">
        <div>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <Link href={`/${locale}`} className="hero__back">
          ← {t.back}
        </Link>
      </header>

      <div className="progress">
        <div className="progress__track" />
        <div className="progress__bar" style={{ width: `${progress}%` }} />
        <div className="progress__labels">
          {t.progressLabels.map((label, index) => (
            <span key={label} className={index === step ? "progress__label progress__label--active" : "progress__label"}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {renderStepContent()}

      <div className="footer">
        <button type="button" className="secondary" onClick={() => setStep((prev) => Math.max(prev - 1, 0))} disabled={step === 0}>
          {t.stepPrev}
        </button>
        {step < t.progressLabels.length - 1 && (
          <button type="button" className="primary" onClick={() => setStep((prev) => Math.min(prev + 1, t.progressLabels.length - 1))}>
            {t.stepNext}
          </button>
        )}
      </div>

      <style jsx>{`
        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
        }

        .hero h1 {
          margin: 0;
          font-size: 2.2rem;
          color: ${COLORS.text.darkGreen};
        }

        .hero p {
          margin: 0.75rem 0 0;
          color: ${COLORS.text.darkBrown};
          line-height: 1.7;
        }

        .hero__back {
          color: ${COLORS.primary.qingzhu};
          font-weight: 600;
          text-decoration: none;
        }

        .progress {
          position: relative;
          padding-bottom: 2.5rem;
        }

        .progress__track {
          position: absolute;
          top: 12px;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(141, 174, 146, 0.25);
          border-radius: 999px;
        }

        .progress__bar {
          position: absolute;
          top: 12px;
          left: 0;
          height: 4px;
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, ${COLORS.secondary.gold});
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .progress__labels {
          display: grid;
          grid-template-columns: repeat(${copy[locale].progressLabels.length}, minmax(0, 1fr));
          gap: 0.75rem;
          position: relative;
        }

        .progress__label {
          font-size: 0.85rem;
          text-align: center;
          color: rgba(72, 66, 53, 0.55);
        }

        .progress__label--active {
          color: ${COLORS.secondary.gold};
          font-weight: 600;
        }

        .card {
          background: rgba(255, 255, 255, 0.92);
          border-radius: 24px;
          padding: 1.9rem;
          box-shadow: 0 22px 42px rgba(45, 64, 51, 0.12);
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }

        .card h2,
        .card h3 {
          margin: 0;
          color: ${COLORS.text.darkGreen};
        }

        .card h3 {
          font-size: 1.5rem;
        }

        .muted {
          margin: 0;
          color: rgba(72, 66, 53, 0.68);
          line-height: 1.6;
        }

        .hint {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(72, 66, 53, 0.68);
        }

        .list {
          margin: 0;
          padding-left: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          color: ${COLORS.text.darkBrown};
        }

        .grid {
          display: grid;
          gap: 1.4rem;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }

        .upload {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.7rem 1.2rem;
          border: 1px dashed rgba(141, 174, 146, 0.5);
          border-radius: 14px;
          color: ${COLORS.text.darkGreen};
          font-weight: 600;
          cursor: pointer;
          background: rgba(249, 247, 243, 0.8);
        }

        .upload input {
          display: none;
        }

        .preview {
          margin-top: 1rem;
          width: 100%;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 14px 28px rgba(45, 64, 51, 0.16);
        }

        .formRow {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .input {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          border: 1px solid rgba(141, 174, 146, 0.4);
          background: rgba(249, 247, 243, 0.8);
          color: ${COLORS.text.darkGreen};
        }

        .calendarToggle {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }

        .toggle {
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          border: 1px solid rgba(141, 174, 146, 0.4);
          background: rgba(255, 255, 255, 0.75);
          color: ${COLORS.text.darkGreen};
          cursor: pointer;
          font-weight: 600;
        }

        .toggle--active {
          border-color: ${COLORS.primary.qingzhu};
          background: rgba(141, 174, 146, 0.18);
          color: ${COLORS.primary.qingzhu};
        }

        .emotionPicker {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .dream-preview {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-top: 1rem;
          padding: 1rem 1.2rem;
          border-radius: 18px;
          background: rgba(141, 174, 146, 0.08);
          color: ${COLORS.text.darkBrown};
        }
        .dream-preview ul {
          margin: 0;
          padding-left: 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .chip {
          border: none;
          border-radius: 12px;
          padding: 0.4rem 0.85rem;
          background: ${COLORS.accent.purple[100]};
          color: ${COLORS.accent.purple[600]};
          font-size: 0.9rem;
          cursor: pointer;
        }

        .agreement {
          display: flex;
          gap: 0.6rem;
          align-items: flex-start;
          font-size: 0.95rem;
          color: ${COLORS.text.darkBrown};
        }

        .agreement input {
          margin-top: 0.2rem;
        }

        .primary {
          border: none;
          border-radius: 999px;
          padding: 0.75rem 1.8rem;
          background: linear-gradient(135deg, ${COLORS.primary.qingzhu}, ${COLORS.secondary.gold});
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 18px 36px rgba(45, 64, 51, 0.24);
        }

        .primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .secondary {
          border: 1px solid rgba(141, 174, 146, 0.4);
          border-radius: 999px;
          padding: 0.7rem 1.6rem;
          background: rgba(255, 255, 255, 0.75);
          color: ${COLORS.text.darkGreen};
          font-weight: 600;
          cursor: pointer;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .hero {
            flex-direction: column;
            align-items: stretch;
          }

          .progress__labels {
            grid-template-columns: repeat(${copy[locale].progressLabels.length}, minmax(0, 1fr));
            font-size: 0.75rem;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .footer {
            flex-direction: column-reverse;
          }

          .footer button {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
