"use client";

import { useState, useEffect, useRef, useId } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { validateImageQuality } from "@/lib/analysis/image/validate";
import { buildV2AnalyzePage, buildV2ResultPage, buildAuthSignInPage, buildHomePage } from "@/lib/v2/routes";
import ErrorBoundary from "@/components/ErrorBoundary";

const MobileCamera = dynamic(() => import("@/components/MobileCamera"), { ssr: false });

type Locale = "zh" | "en";
type PageProps = {
  params: { locale?: string };
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png"];

const TEXT = {
  zh: {
    title: "开启今日东方洞察",
    subtitle: "上传掌纹、舌苔，写下一个最近的梦，SeeQi 会为你整理当下的状态与走向。",
    palmTitle: "掌纹 · 当前生命节奏",
    palmDescription: "通过生命线、感情线、智慧线、财富线，看你此刻的节奏、关系与思路状态。",
    tongueTitle: "舌苔 · 身体气机与能量",
    tongueDescription: "参考中医保健视角，从舌色与舌苔，看最近的气机、精力与消化状态（非医疗）。",
    dreamTitle: "梦境 · 内心在说什么",
    dreamIntro: "",
    dreamPlaceholder: "用几句话描述一个最近印象最深的梦，越具体越好：发生了什么？谁在场？你当时什么感受？",
    bottomHint: "SeeQi 会综合掌纹、舌苔与梦境，为你生成一份今日东方状态报告，不构成医疗或确定性预测。",
    submitButton: "开始生成今日洞察",
    submitButtonLoading: "正在生成...",
    upload: "上传图片",
    openCamera: "拍照",
    remove: "移除",
    preview: "已选择",
  },
  en: {
    title: "Start Today's Eastern Insight",
    subtitle: "Upload palm and tongue images, write about a recent dream. SeeQi will help you understand your current state and direction.",
    palmTitle: "Palm · Current Life Rhythm",
    palmDescription: "Through the life, heart, wisdom, and wealth lines, observe your current rhythm, relationships, and mindset.",
    tongueTitle: "Tongue · Body Qi & Energy",
    tongueDescription: "From a TCM wellness perspective, observe your recent qi, energy, and digestion through tongue color and coating (not medical).",
    dreamTitle: "Dream · What Your Inner Self Says",
    dreamIntro: "",
    dreamPlaceholder: "Describe a recent dream that left a strong impression. Be specific: What happened? Who was there? How did you feel?",
    bottomHint: "SeeQi will synthesize palm, tongue, and dream data to generate a daily Eastern state report. Not medical or predictive.",
    submitButton: "Generate Today's Insight",
    submitButtonLoading: "Generating...",
    upload: "Upload Image",
    openCamera: "Take Photo",
    remove: "Remove",
    preview: "Selected",
  },
} as const;

type FieldErrorKey = "palm" | "tongue" | "dream";

function V2AnalyzePageContent({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const t = TEXT[locale];

  const [palmFile, setPalmFile] = useState<File | null>(null);
  const [tongueFile, setTongueFile] = useState<File | null>(null);
  const [dreamText, setDreamText] = useState("");
  const [errors, setErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  // 初始值设为 true，避免服务器端和客户端不一致导致的 hydration 错误
  // 实际值会在 useEffect 中更新
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [cameraSupported, setCameraSupported] = useState(false);
  const [isPointerCoarse, setIsPointerCoarse] = useState(false);
  const [activeCameraMode, setActiveCameraMode] = useState<null | "palm" | "tongue">(null);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 摄像头流管理

  useEffect(() => {
    if (!activeCameraMode) {
      // 如果没有激活模式，停止所有流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const startCamera = async () => {
      try {
        // 停止之前的流
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // 启动新的摄像头流
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // 使用后置摄像头
          },
          audio: false,
        });

        streamRef.current = stream;
        
        // 等待模态框渲染完成，再设置 video
        const trySetVideo = () => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((err) => {
              // 视频播放错误，已通过 UI 显示错误消息
            });
            return true;
          }
          return false;
        };

        // 立即尝试
        if (!trySetVideo()) {
          // 如果 videoRef 还没有准备好，等待一下
          setTimeout(() => {
            if (!trySetVideo()) {
              // 再等一次
              setTimeout(() => {
                trySetVideo();
              }, 300);
            }
          }, 200);
        }
      } catch (err) {
        // 相机访问错误，已通过 UI 显示错误消息
        setCameraMessage(
          locale === "zh" ? "无法访问摄像头，请检查权限设置" : "Cannot access camera, please check permissions",
        );
        // 错误时不自动关闭相机，让用户手动关闭
      }
    };

    // 等待一小段时间确保模态框已渲染
    const timer = setTimeout(() => {
      void startCamera();
    }, 100);

    // 清理函数：清除定时器并关闭摄像头流
    return () => {
      clearTimeout(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [activeCameraMode, locale]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const setOfflineMessage = () =>
      setStatusMessage(
        locale === "zh"
          ? "当前处于离线状态，暂无法上传或生成报告，请连接网络后再试。"
          : "You are offline, unable to upload or generate a new report. Please reconnect and try again.",
      );
    const handleOnline = () => {
      setIsOnline(true);
      setStatusMessage("");
    };
    const handleOffline = () => {
      setIsOnline(false);
      setOfflineMessage();
    };
    if (!window.navigator.onLine) {
      handleOffline();
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [locale]);

  useEffect(() => {
    if (typeof navigator === "undefined" || typeof window === "undefined") {
      return;
    }
    const supported = Boolean(window.isSecureContext !== false && navigator.mediaDevices?.getUserMedia);
    setCameraSupported(supported);
    if (typeof window.matchMedia !== "function") {
      setIsPointerCoarse(false);
      return;
    }
    const media = window.matchMedia("(pointer: coarse)");
    const updatePointer = (event?: MediaQueryListEvent) => {
      setIsPointerCoarse(event ? event.matches : media.matches);
    };
    updatePointer();
    if (typeof media.addEventListener === "function") {
      const listener = (event: MediaQueryListEvent) => updatePointer(event);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
    const legacyListener = (event: MediaQueryListEvent) => updatePointer(event);
    media.addListener(legacyListener);
    return () => media.removeListener(legacyListener);
  }, []);


  const makeFileSelector =
  (field: FieldErrorKey, setter: (file: File | null) => void) =>
    (file: File | null): boolean => {
      if (!file) {
        setter(null);
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        return true;
      }

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setter(null);
        setErrors((prev) => ({
          ...prev,
          [field]: locale === "zh" ? "仅支持 JPEG 或 PNG 格式" : "Only JPEG or PNG formats are supported",
        }));
        return false;
      }

      if (file.size > MAX_FILE_SIZE) {
        setter(null);
        setErrors((prev) => ({
          ...prev,
          [field]: locale === "zh" ? "文件大小不能超过 5MB" : "File size must not exceed 5MB",
        }));
        return false;
      }

      setter(file);
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      return true;
    };

  const selectPalmFile = makeFileSelector("palm", setPalmFile);
  const selectTongueFile = makeFileSelector("tongue", setTongueFile);

  const getQualityMessage = (type: "palm" | "tongue", reason: string) => {
    if (locale === "zh") {
      if (type === "palm") {
        return reason === "too_small"
          ? "照片离得有点远，靠近一些再拍试试～"
          : "照片有些模糊，换一张更清晰的手掌照片吧 ❤️";
      }
      return reason === "too_small"
        ? "舌苔画面太小了，再靠近一点拍会更清楚哦"
        : "看不太清楚舌苔细节，重新拍一张清晰照片再上传吧";
    }
    if (type === "palm") {
      return reason === "too_small"
        ? "The palm is a bit far away. Try a closer photo."
        : "The photo looks blurry—retake a clearer one.";
    }
    return reason === "too_small"
      ? "The tongue photo is too small. Please move closer and try again."
      : "The tongue photo isn't clear enough. Please capture a sharper one.";
  };

  const handleSelectPalm = async (file: File | null): Promise<boolean> => {
    if (!file) {
      const result = selectPalmFile(null);
      setStatusMessage("");
      return result;
    }
    const quality = await validateImageQuality(file);
    if (!quality.ok && "reason" in quality) {
      setStatusMessage(getQualityMessage("palm", quality.reason));
      return false;
    }
    const result = selectPalmFile(file);
    setStatusMessage("");
    return result;
  };

  const handleSelectTongue = async (file: File | null): Promise<boolean> => {
    if (!file) {
      const result = selectTongueFile(null);
      setStatusMessage("");
      return result;
    }
    const quality = await validateImageQuality(file);
    if (!quality.ok && "reason" in quality) {
      setStatusMessage(getQualityMessage("tongue", quality.reason));
      return false;
    }
    const result = selectTongueFile(file);
    setStatusMessage("");
    return result;
  };

  const handleRequestCamera = (mode: "palm" | "tongue"): boolean => {
    // 确保 activeCameraMode 被设置（按钮已经设置，这里再次确认）
    setActiveCameraMode(mode);
    
    // 如果已经有激活的相机模式，先关闭它（允许切换模式）
    if (activeCameraMode && activeCameraMode !== mode) {
      // 停止之前的摄像头流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    // 暂时跳过在线检查，允许离线使用摄像头
    // if (!isOnline) {
    //   setCameraMessage(
    //     locale === "zh" ? "离线状态无法启用拍照，请连接网络后再试。" : "Camera capture requires an internet connection.",
    //   );
    //   return false;
    // }
    
    // 强制检查摄像头支持（即使 cameraSupported 为 false 也尝试）
    const hasMediaDevices = typeof navigator !== "undefined" && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
    
    if (!hasMediaDevices && !cameraSupported) {
      const message = locale === "zh" ? "当前设备不支持相机功能，请使用上传图片功能" : "Camera not supported on this device, please use upload instead";
      setCameraMessage(message);
      // 即使不支持，也尝试打开摄像头（某些浏览器可能仍然支持）
    }
    
    setCameraMessage(null);
    return true;
  };

  const handleCameraClose = () => {
    // 停止摄像头流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveCameraMode(null);
    setCameraMessage(null);
  };

  const handleCameraConfirm = (mode: "palm" | "tongue") => async (file: File): Promise<boolean> => {
    // 先关闭模态框和清理资源
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraMessage(null);
    setActiveCameraMode(null);
    
    // 然后处理文件
    const handler = mode === "palm" ? handleSelectPalm : handleSelectTongue;
    const success = await handler(file);
    if (!success) {
      // 验证失败时显示错误消息（模态框已经关闭）
      setStatusMessage(
        locale === "zh" ? "照片验证失败，请重新拍照" : "Photo validation failed, please try again.",
      );
      return false;
    }
    // 成功时更新文件名显示
    const fileNameSpan = document.getElementById(mode === "palm" ? "palm-image-name" : "tongue-image-name");
    if (fileNameSpan) {
      fileNameSpan.textContent = file.name;
    }
    return true;
  };

  const validate = () => {
    const nextErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (!palmFile) {
      nextErrors.palm = locale === "zh" ? "请上传掌纹图片" : "Please upload a palm image";
    }
    if (!tongueFile) {
      nextErrors.tongue = locale === "zh" ? "请上传舌苔图片" : "Please upload a tongue image";
    }
    if (!dreamText.trim()) {
      nextErrors.dream = locale === "zh" ? "请描述一个最近的梦" : "Please describe a recent dream";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    // 检查登录状态
    if (sessionStatus === "loading") {
      setStatusMessage(locale === "zh" ? "正在检查登录状态..." : "Checking login status...");
      return;
    }

    // 允许匿名用户提交（不再强制登录）
    // 登录状态会在后端处理，如果有 session 则关联 userId，否则 userId=null
    const isValid = validate();
    if (!isValid) {
      return;
    }

    if (!palmFile || !tongueFile) return;

    setSubmitting(true);
    setStatusMessage(locale === "zh" ? "正在生成报告..." : "Generating report...");

    try {
      const formData = new FormData();
      formData.append("palm_image", palmFile);
      formData.append("tongue_image", tongueFile);
      formData.append("dream_text", dreamText.trim());
      formData.append("locale", locale);
      formData.append("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai");

      const response = await fetch("/api/v2/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      
      // 统一格式处理：{ ok: true, reportId, data: { ... } } 或 { ok: false, code, message }
      if (!response.ok || !data || data.ok === false) {
        const message = data?.message || data?.error || (locale === "zh" ? "生成报告失败，请稍后重试" : "Failed to generate report, please try again");
        setStatusMessage(message);
        setSubmitting(false);
        return;
      }

      // 成功格式：{ ok: true, reportId, data: { ... } }
      if (data.ok === true && data.reportId) {
        const reportId = data.reportId as string;
        const resultUrl = buildV2ResultPage(locale, reportId);
        router.push(resultUrl);
        return;
      }

      // 兼容旧格式（向后兼容）
      const reportId = data.report_id as string | undefined;
      if (reportId) {
        const resultUrl = buildV2ResultPage(locale, reportId);
        router.push(resultUrl);
        return;
      }

      // 如果都不匹配，显示错误
      setStatusMessage(locale === "zh" ? "报告生成失败" : "Report generation failed");
      setSubmitting(false);
    } catch (error) {
      setStatusMessage(locale === "zh" ? "网络错误，请稍后重试" : "Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  // 样式内容
  const styles = `
        /* CSS Reset - 确保所有元素基础干净 */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        /* 全局样式 - 与首页风格保持一致 */
        body {
          font-family: 'Noto Sans SC', sans-serif;
          background-color: #1A202C;
          color: #C8D0DA;
          line-height: 1.7;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* 通用内容居中容器 */
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 40px;
        }

        /* main 标签，用于填充剩余空间 */
        main {
          flex-grow: 1;
        }

        /* 通用按钮基础样式 */
        button {
          border: none;
          cursor: pointer;
          font-family: 'Noto Sans SC', sans-serif;
          outline: none;
          transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
        }

        /* 顶部返回链接 Header 样式 - 与首页 Header 风格一致 */
        header.sub-page-header {
          background-color: #2D3748;
          padding: 15px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        header.sub-page-header .header-container {
          display: flex;
          align-items: center;
        }

        header.sub-page-header .back-link {
          color: #FF7B54;
          text-decoration: none;
          font-size: 17px;
          font-weight: 600;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 5px 0;
          transition: color 0.3s ease, transform 0.2s ease;
        }

        header.sub-page-header .back-link::before {
          content: '←';
          font-size: 20px;
          line-height: 1;
        }

        header.sub-page-header .back-link:hover {
          color: #E66A48;
          transform: translateX(-3px);
        }

        /* 第三步：主内容区域通用样式 */
        main.secondary-page-content {
          flex-grow: 1;
          padding: 60px 0 80px 0;
        }

        /* 页面主标题 */
        .page-title {
          font-size: 44px;
          line-height: 1.25;
          margin-bottom: 18px;
          color: #F8F8F8;
          font-weight: 700;
          text-align: left;
        }

        /* 页面描述 */
        .page-description {
          font-size: 19px;
          line-height: 1.8;
          color: #B0BACC;
          margin-bottom: 60px;
          text-align: left;
        }

        /* 第四步：输入卡片网格布局 */
        .input-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 25px;
          margin-bottom: 60px;
        }

        /* 单个输入卡片样式 */
        .input-card {
          background-color: #F0F2F5;
          color: #2D3748;
          padding: 38px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-height: 400px;
          position: relative;
          z-index: 1;
          overflow: visible; /* 确保按钮不被裁剪 */
        }

        .card-icon-wrapper {
          background-color: rgba(255, 123, 84, 0.15);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .card-icon {
          font-size: 42px;
          line-height: 1;
          -webkit-filter: grayscale(100%) brightness(0.9);
          filter: grayscale(100%) brightness(0.9);
        }

        .card-title {
          font-size: 28px;
          line-height: 1.3;
          margin-bottom: 18px;
          font-weight: 700;
          color: #2D3748;
        }

        .card-description {
          font-size: 16px;
          line-height: 1.75;
          color: #5C6A7D;
          margin-bottom: 35px;
          flex-grow: 1;
        }

        /* 文件上传区域 */
        .upload-area {
          width: 100%;
          margin-top: auto;
          padding-top: 15px;
        }

        .upload-tip {
          font-size: 14px;
          color: #6C7A90;
          margin-bottom: 12px;
        }

        .file-inputs {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .file-label {
          display: inline-flex;
          align-items: center;
          padding: 10px 18px;
          border-radius: 8px;
          border: 2px solid #CBD5E0;
          cursor: pointer;
          font-size: 15px;
          color: #4A5568;
          flex-shrink: 0;
          background-color: #EBF0F5;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
          transition: background-color 0.3s ease, border-color 0.3s ease, transform 0.2s ease;
          position: relative;
          z-index: 1; /* 确保 label 不会覆盖按钮 */
        }

        .file-label:hover {
          background-color: #DDE5ED;
          border-color: #A0AEC0;
          transform: translateY(-1px);
        }

        .hidden-file-input {
          display: none;
        }

        .file-label span:first-child {
          font-weight: 700;
          margin-right: 10px;
          color: #252D3B;
        }

        .file-name {
          color: #7B8B9E;
          font-size: 14px;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* 操作按钮 (上传图片/拍照) */
        .action-button {
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          pointer-events: auto !important;
          position: relative;
          z-index: 10;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        .primary-action {
          background-color: #FF7B54;
          color: white;
        }

        .primary-action:hover {
          background-color: #E66A48;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
        }

        .secondary-action {
          background-color: #4A5568;
          color: white;
          pointer-events: auto !important;
          position: relative !important;
          z-index: 10000 !important;
        }

        .secondary-action:hover {
          background-color: #3C475A;
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
        }
        
        .camera-trigger {
          pointer-events: auto !important;
          z-index: 10001 !important;
          cursor: pointer !important;
          position: relative !important;
        }

        /* 梦境输入区域 */
        .dream-input-area {
          width: 100%;
          margin-top: auto;
        }

        .dream-textarea {
          width: 100%;
          min-height: 180px;
          padding: 18px;
          border: 2px solid #CBD5E0;
          border-radius: 10px;
          font-size: 16px;
          line-height: 1.7;
          color: #252D3B;
          background-color: #EBF0F5;
          resize: vertical;
          font-family: 'Noto Sans SC', sans-serif;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .dream-textarea::placeholder {
          color: #A0AEC0;
          font-style: italic;
        }

        .dream-textarea:focus {
          outline: none;
          border-color: #FF7B54;
          box-shadow: 0 0 0 4px rgba(255, 123, 84, 0.3);
        }

        /* 第五步：最终提示语 */
        .final-remark {
          font-size: 16px;
          color: #B0BACC;
          margin-top: 50px;
          margin-bottom: 50px;
          line-height: 1.8;
          text-align: left;
        }

        /* 提交按钮区域 */
        .submit-button-wrapper {
          text-align: center;
          padding-bottom: 60px;
        }

        .primary-button.final-submit-button {
          background-color: #FF7B54;
          color: white;
          padding: 20px 45px;
          border-radius: 10px;
          font-size: 19px;
          font-weight: 700;
          transition: background-color 0.3s ease, color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          line-height: 1;
          box-shadow: 0 6px 20px rgba(255, 123, 84, 0.3);
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 10;
        }
        
        .primary-button.final-submit-button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          pointer-events: none;
        }

        .primary-button.final-submit-button:hover:not(:disabled) {
          background-color: #E66A48;
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(255, 123, 84, 0.4);
        }

        /* 第六步：Footer (与首页一致，微调) */
        footer {
          background-color: #2D3748;
          color: #9AA6B8;
          text-align: center;
          padding: 30px 20px;
          font-size: 13px;
          line-height: 1.8;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          flex-shrink: 0;
        }

        footer .footer-container p {
          margin: 6px 0;
        }

        /* 第七步：拍照模块整体容器 - 默认隐藏 */
        #camera-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%; /* 全屏覆盖 */
          background-color: rgba(10, 15, 20, 0.95); /* 更深的半透明背景 */
          z-index: 9999; /* 确保在最上层，使用更高的 z-index */
          display: none; /* 默认完全隐藏，不占用空间也不阻止点击 */
          flex-direction: column;
          justify-content: flex-end; /* 内容从底部浮出 */
          align-items: center;
          opacity: 0;
          transform: translateY(0);
          transition: opacity 0.3s ease;
          pointer-events: auto; /* 确保可以接收点击事件 */
        }

        /* 拍照模块激活状态 */
        #camera-modal.is-active {
          display: flex !important; /* 显示时使用 flex，强制覆盖 */
          opacity: 1 !important;
          pointer-events: auto !important; /* 确保可以接收点击事件 */
        }

        /* 拍照面板内容区域 */
        .camera-panel-content {
          background: linear-gradient(180deg, #2D3748 0%, #1A202C 100%); /* 渐变背景 */
          width: 100%;
          max-width: 1200px; /* 最大宽度与 container 一致 */
          border-top-left-radius: 25px; /* 增大圆角 */
          border-top-right-radius: 25px;
          padding: 40px 50px; /* 增大内边距 */
          box-shadow: 0 -15px 40px rgba(0, 0, 0, 0.6); /* 更强烈的阴影 */
          border-top: 1px solid rgba(255, 255, 255, 0.08); /* 顶部细边框 */
          display: flex;
          flex-direction: column;
          max-height: 90vh; /* 限制高度 */
          overflow-y: auto; /* 超出可滚动 */
          overflow-x: hidden; /* 防止横向滚动 */
          position: relative; /* 确保子元素可以正确定位 */
          z-index: 1; /* 确保在模态框内 */
        }
        
        /* 确保按钮区域不被裁剪 */
        .camera-panel-content > .camera-capture-footer {
          flex-shrink: 0; /* 防止按钮区域被压缩 */
          position: relative;
          z-index: 10002 !important;
        }

        /* 拍照模块顶部Header */
        .camera-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px; /* 增大间距 */
          color: #B0BACC; /* 调整文字颜色 */
          font-size: 16px; /* 增大字号 */
          flex-wrap: wrap; /* 确保小屏幕下换行 */
        }

        .camera-header .camera-tip {
          font-weight: 700; /* 加粗提示语 */
          flex-grow: 1;
          margin-right: 20px;
          line-height: 1.4;
          color: #E2E8F0; /* 提示语更亮 */
        }

        .camera-header .camera-controls {
          display: flex;
          align-items: center;
          gap: 25px; /* 增大控制按钮间距 */
          flex-shrink: 0;
        }

        .camera-header .control-button {
          background-color: rgba(255, 255, 255, 0.15); /* 按钮背景更亮 */
          color: #E2E8F0; /* 按钮文字更亮 */
          padding: 10px 18px; /* 调整内边距 */
          border-radius: 8px; /* 增大圆角 */
          font-size: 15px;
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 增加阴影 */
        }

        .camera-header .control-button:hover {
          background-color: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px); /* 悬停时轻微上浮 */
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .camera-header .icon-button {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .camera-header .icon-button .icon {
          font-size: 20px; /* 增大图标 */
          line-height: 1;
          -webkit-filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3)); /* 增加图标阴影 */
          filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.3)); /* 增加图标阴影 */
        }

        /* 滑块样式 */
        .slider-group {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
        }

        .slider {
          -webkit-appearance: none;
          width: 120px; /* 增大滑块宽度 */
          height: 8px; /* 增大滑块高度 */
          background: #4A5568;
          border-radius: 4px;
          outline: none;
          transition: opacity .2s;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px; /* 增大滑块手柄 */
          height: 20px;
          border-radius: 50%;
          background: #FF7B54;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255, 123, 84, 0.6); /* 增强手柄光晕 */
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #FF7B54;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255, 123, 84, 0.6);
        }

        /* 摄像头预览区域 */
        .camera-preview-area {
          width: 100%;
          aspect-ratio: 16/9; /* 保持16:9的视频比例 */
          background-color: #000;
          border-radius: 15px; /* 增大圆角 */
          position: relative;
          overflow: hidden;
          margin-bottom: 30px;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.5); /* 内部阴影，增加深度感 */
          z-index: 1; /* 确保在按钮之下 */
          pointer-events: auto; /* 允许视频区域交互 */
        }
        
        /* 确保预览区域不会覆盖按钮 */
        .camera-preview-area::after {
          content: '';
          position: absolute;
          bottom: -30px;
          left: 0;
          right: 0;
          height: 30px;
          pointer-events: none;
          z-index: -1;
        }

        #camera-video-feed {
          width: 100%;
          height: 100%;
          object-fit: cover; /* 填充区域 */
          transform: scaleX(-1); /* 默认镜像前置摄像头 */
          border-radius: 15px; /* 视频本身也要有圆角 */
        }

        /* 取景框叠加层 - 完全移除 box-shadow 避免覆盖按钮 */
        .overlay-frame {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 70%; /* 取景框宽度 */
          height: 90%; /* 取景框高度 */
          border: 2px solid rgba(255, 123, 84, 0.8); /* 橘红色边框更亮 */
          border-radius: 10px; /* 增大圆角 */
          pointer-events: none !important; /* 不阻止下方视频交互，强制禁用 */
          z-index: 1; /* 确保在视频之上，但在按钮之下 */
          /* 完全移除 box-shadow，避免覆盖按钮区域 */
          box-shadow: none !important;
        }

        /* 拍照模块底部Footer (拍照按钮) */
        .camera-capture-footer {
          display: flex;
          justify-content: center;
          padding-top: 20px;
          position: relative;
          z-index: 10002 !important; /* 提高 z-index，确保在最上层 */
          pointer-events: auto !important; /* 确保可以接收点击事件 */
          min-height: 100px; /* 确保有足够空间 */
          background: transparent; /* 确保背景透明，不遮挡 */
          isolation: isolate; /* 创建新的堆叠上下文 */
        }
        

        .capture-button {
          width: 75px; /* 增大拍照按钮 */
          height: 75px;
          border-radius: 50%;
          background-color: #FF7B54;
          color: white;
          font-size: 0; /* 隐藏文字，实际可能用图标 */
          border: 6px solid rgba(255, 255, 255, 0.4); /* 外环更粗更明显 */
          box-shadow: 0 0 0 3px #FF7B54, 0 0 15px rgba(255, 123, 84, 0.7); /* 增强光晕和内部阴影 */
          transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.3s ease;
          position: relative;
          z-index: 10003 !important; /* 进一步提高 z-index */
          pointer-events: auto !important; /* 确保可以接收点击事件 */
          touch-action: manipulation; /* 优化触摸响应 */
          -webkit-tap-highlight-color: transparent; /* 移除点击高亮 */
          cursor: pointer;
          isolation: isolate; /* 创建新的堆叠上下文 */
        }

        .capture-button::after { /* 模拟相机快门图标 */
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 28px; /* 增大快门图标 */
          height: 23px;
          border-radius: 3px;
          border: 3px solid white;
          background-color: transparent;
          pointer-events: none !important; /* 关键：确保伪元素不阻止点击 */
          z-index: -1; /* 确保在按钮内容之下 */
        }

        .capture-button:hover {
          background-color: #E66A48;
          transform: scale(1.08); /* 悬停时增大更多 */
          box-shadow: 0 0 0 3px #FF7B54, 0 0 20px rgba(255, 123, 84, 0.9); /* 悬停时光晕更强 */
        }

        /* 第八步：响应式设计 - 针对小屏幕 */
        @media (max-width: 768px) {
          .container {
            padding: 0 20px;
          }

          main.secondary-page-content {
            padding: 30px 0 50px 0; /* 调整内边距 */
          }

          header.sub-page-header .back-link {
            font-size: 16px;
            gap: 6px;
            padding: 3px 0;
          }

          header.sub-page-header .back-link::before {
            font-size: 18px;
          }

          .page-title {
            font-size: 34px;
            margin-bottom: 12px;
          }

          .page-description {
            font-size: 17px;
            margin-bottom: 40px;
          }

          .input-cards-grid {
            grid-template-columns: 1fr; /* 单列布局 */
            gap: 20px; /* 减小卡片间距 */
            margin-bottom: 40px;
          }

          .input-card {
            padding: 30px; /* 调整内边距 */
            /* 移除 min-height: auto，Firefox 不支持 */
          }

          .card-icon-wrapper {
            margin-bottom: 20px;
            padding: 10px;
            border-radius: 8px;
          }

          .card-icon {
            font-size: 36px;
            -webkit-filter: grayscale(100%) brightness(0.9); /* 将图标变为灰白色 */
            filter: grayscale(100%) brightness(0.9); /* 将图标变为灰白色 */
          }

          .card-title {
            font-size: 24px;
            margin-bottom: 12px;
          }

          .card-description {
            font-size: 15px;
            margin-bottom: 25px;
          }

          .upload-area {
            padding-top: 10px;
          }

          .upload-tip {
            font-size: 13px;
            margin-bottom: 10px;
          }

          .file-inputs {
            flex-direction: column; /* 垂直堆叠 */
            align-items: stretch; /* 宽度占满 */
            gap: 10px;
          }

          .file-label {
            width: 100%;
            justify-content: space-between;
            padding: 9px 15px;
            border-radius: 6px;
            font-size: 14px;
          }

          .file-name {
            max-width: none; /* 文件名不限制宽度 */
            white-space: normal; /* 允许换行 */
            text-align: right;
          }

          .action-button {
            width: 100%;
            padding: 9px 15px;
            border-radius: 6px;
            font-size: 14px;
          }

          .dream-textarea {
            min-height: 150px;
            padding: 15px;
            border-radius: 8px;
            font-size: 15px;
          }

          .final-remark {
            font-size: 14px;
            margin-top: 30px;
            margin-bottom: 30px;
          }

          .primary-button.final-submit-button {
            padding: 16px 35px;
            border-radius: 8px;
            font-size: 17px;
            width: 100%; /* 宽度占满 */
          }

          /* 拍照模块在小屏幕下的修饰 */
          .camera-panel-content {
            padding: 25px 20px; /* 调整内边距 */
            border-top-left-radius: 15px;
            border-top-right-radius: 15px;
          }

          .camera-header {
            margin-bottom: 20px;
            flex-direction: column; /* 垂直堆叠 */
            align-items: flex-start;
            gap: 15px;
            font-size: 14px;
          }

          .camera-header .camera-tip {
            margin-right: 0;
            text-align: center;
            width: 100%;
          }

          .camera-header .camera-controls {
            flex-direction: row; /* 保持水平 */
            width: 100%;
            justify-content: space-between;
            gap: 10px;
          }

          .camera-header .control-button {
            flex: 1; /* 按钮平均分配宽度 */
            padding: 8px 10px;
            font-size: 13px;
          }

          .camera-header .icon-button .icon {
            font-size: 16px;
          }

          .slider-group {
            display: none; /* 手机上隐藏滑块，节省空间 */
          }

          .camera-preview-area {
            margin-bottom: 20px;
            aspect-ratio: 4/3; /* 手机上更接近4:3 */
          }

          .overlay-frame {
            width: 80%;
            height: 90%;
          }

          .capture-button {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.4);
          }

          .capture-button::after {
            width: 22px;
            height: 18px;
            border: 2px solid white;
          }

          footer {
            padding: 25px 20px;
            font-size: 12px;
          }
        }
      `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      
      <div className="analyze-page-wrapper">
        {/* 第二步：顶部导航栏 */}
        <header className="sub-page-header">
          <div className="header-container container">
            <Link href={buildHomePage(locale)} className="back-link">
              ← 返回首页
          </Link>
        </div>
        </header>
        
        {/* 第三步：主内容区：页面标题与描述 */}
        <main className="secondary-page-content">
          <div className="container">
            <h1 className="page-title">{t.title}</h1>
            <p className="page-description">{t.subtitle}</p>
            
            {/* 第四步：输入模块卡片 (3列布局) */}
            <div className="input-cards-grid">
              {/* 掌纹卡片 */}
              <div className="input-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">🖐️</span>
                </div>
                <h2 className="card-title">{t.palmTitle}</h2>
                <p className="card-description">{t.palmDescription}</p>
                <div className="upload-area">
                  <p className="upload-tip">点击下方按钮上传或拍照</p>
                  <div className="file-inputs">
                    <label className="file-label" htmlFor="palm-file-input">
                      <input
                        type="file"
                        id="palm-file-input"
                        className="hidden-file-input"
                        data-target="palm-image"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0] ?? null;
                          await handleSelectPalm(file);
                          if (file && e.target) {
                            const fileNameSpan = document.getElementById("palm-image-name");
                            if (fileNameSpan) fileNameSpan.textContent = file.name;
                          } else if (e.target) {
                            const fileNameSpan = document.getElementById("palm-image-name");
                            if (fileNameSpan) fileNameSpan.textContent = "未选择文件";
                          }
                        }}
                      />
                      <span>选择文件</span>
                      <span className="file-name" id="palm-image-name">
                        {palmFile ? palmFile.name : "未选择文件"}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="action-button primary-action"
                      onClick={() => document.getElementById("palm-file-input")?.click()}
                    >
                      上传图片
                    </button>
                    <button
                      type="button"
                      className="action-button secondary-action camera-trigger"
                      data-input-type="palm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCameraMode("palm");
                        void handleRequestCamera("palm");
                      }}
                      style={{ 
                        position: 'relative', 
                        zIndex: 10001, 
                        pointerEvents: 'auto', 
                        cursor: 'pointer',
                        backgroundColor: '#4A5568',
                        color: 'white',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: 700
                      }}
                    >
                      拍照
                    </button>
                  </div>
                </div>
              </div>

              {/* 舌苔卡片 */}
              <div className="input-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">👅</span>
                </div>
                <h2 className="card-title">{t.tongueTitle}</h2>
                <p className="card-description">{t.tongueDescription}</p>
                <div className="upload-area">
                  <p className="upload-tip">点击下方按钮上传或拍照</p>
                  <div className="file-inputs">
                    <label className="file-label" htmlFor="tongue-file-input">
                      <input
                        type="file"
                        id="tongue-file-input"
                        className="hidden-file-input"
                        data-target="tongue-image"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0] ?? null;
                          await handleSelectTongue(file);
                          if (file && e.target) {
                            const fileNameSpan = document.getElementById("tongue-image-name");
                            if (fileNameSpan) fileNameSpan.textContent = file.name;
                          } else if (e.target) {
                            const fileNameSpan = document.getElementById("tongue-image-name");
                            if (fileNameSpan) fileNameSpan.textContent = "未选择文件";
                          }
                        }}
                      />
                      <span>选择文件</span>
                      <span className="file-name" id="tongue-image-name">
                        {tongueFile ? tongueFile.name : "未选择文件"}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="action-button primary-action"
                      onClick={() => document.getElementById("tongue-file-input")?.click()}
                    >
                      上传图片
                    </button>
                    <button
                      type="button"
                      className="action-button secondary-action camera-trigger"
                      data-input-type="tongue"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveCameraMode("tongue");
                        void handleRequestCamera("tongue");
                      }}
                      style={{ 
                        position: 'relative', 
                        zIndex: 10001, 
                        pointerEvents: 'auto', 
                        cursor: 'pointer',
                        backgroundColor: '#4A5568',
                        color: 'white',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '15px',
                        fontWeight: 700
                      }}
                    >
                      拍照
                    </button>
                  </div>
                </div>
        </div>

              {/* 梦境卡片 */}
              <div className="input-card">
                <div className="card-icon-wrapper">
                  <span className="card-icon">✨</span>
                </div>
                <h2 className="card-title">{t.dreamTitle}</h2>
                <p className="card-description">
                  梦境亦真亦幻，景象皆藏其间。它是一种提醒，更是一种来自心灵深处的无声暗示。
                </p>
                <div className="dream-input-area">
          <textarea
            id="dream-text-input"
            name="dream-text"
            value={dreamText}
            onChange={(event) => setDreamText(event.target.value)}
            placeholder="请描述您最近的梦境，越详细越好。比如：梦里发生了什么？谁在？你当时有什么感受？"
            className="dream-textarea"
          />
            </div>
              </div>
            </div>
            
            {/* 第五步：最终提示语与提交按钮 */}
            <p className="final-remark">SeeQi 会综合掌纹、舌苔与梦境，为你生成一份今日东方状态报告，不构成医疗诊断或确定性预测。</p>
            
            <div className="submit-button-wrapper">
          <button 
                type="button"
                className="primary-button final-submit-button"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (submitting) {
                    return;
                  }

                  // 允许匿名用户提交（不再强制登录）
                  // 登录状态会在后端处理，如果有 session 则关联 userId，否则 userId=null
                  const isValid = validate();
                  if (!isValid) {
                    return;
                  }

                  if (!palmFile || !tongueFile) {
                    return;
                  }

                  setSubmitting(true);
                  setStatusMessage(locale === "zh" ? "正在生成报告..." : "Generating report...");

                  try {
                    const formData = new FormData();
                    formData.append("palm_image", palmFile);
                    formData.append("tongue_image", tongueFile);
                    formData.append("dream_text", dreamText.trim());
                    formData.append("locale", locale);
                    formData.append("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Shanghai");

                    const response = await fetch("/api/v2/analyze", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) {
                      let data: any = null;
                      try {
                        const text = await response.text();
                        data = text ? JSON.parse(text) : null;
                      } catch (parseError) {
                        // 忽略解析错误，使用默认错误消息
                      }
                      
                      const message = data?.message || data?.error || (locale === "zh" ? "生成报告失败，请稍后重试" : "Failed to generate report, please try again");
                      setStatusMessage(message);
                      setSubmitting(false);
                      return;
                    }

                    const data = await response.json();
                    
                    // 统一格式处理：{ ok: true, reportId, data: { ... } } 或 { ok: false, code, message }
                    if (!response.ok || !data || data.ok === false) {
                      const message = data?.message || data?.error || (locale === "zh" ? "生成报告失败，请稍后重试" : "Failed to generate report, please try again");
                      setStatusMessage(message);
                      setSubmitting(false);
                      return;
                    }

                    // 成功格式：{ ok: true, reportId, data: { ... } }
                    let reportId: string | undefined;
                    if (data.ok === true && data.reportId) {
                      reportId = data.reportId as string;
                    } else if (data.report_id) {
                      // 兼容旧格式（向后兼容）
                      reportId = data.report_id as string;
                    }

                    if (!reportId) {
                      setStatusMessage(locale === "zh" ? "报告生成失败" : "Report generation failed");
                      setSubmitting(false);
                      return;
                    }

                    const resultUrl = buildV2ResultPage(locale, reportId);
                    router.push(resultUrl);
                  } catch (error) {
                    setStatusMessage(locale === "zh" ? "网络错误，请稍后重试" : "Network error, please try again");
                  } finally {
                    setSubmitting(false);
                  }
                }}
            disabled={submitting || !isOnline}
            style={{ 
              cursor: (submitting || !isOnline) ? 'not-allowed' : 'pointer',
              opacity: (submitting || !isOnline) ? 0.6 : 1
            }}
          >
                {submitting ? t.submitButtonLoading : t.submitButton}
          </button>
          {!isOnline && (
            <p style={{ color: '#ff6b6b', marginTop: '10px', fontSize: '14px' }}>
              {locale === "zh" ? "当前处于离线状态，请连接网络后重试" : "You are offline, please connect to the internet"}
            </p>
          )}
        </div>
          </div>
        </main>
        
        {/* 第六步：底部页脚 (Footer) */}
        <footer>
          <div className="footer-container container">
            <p>© 2025 SeeQi</p>
            <p>隐私声明：我们尊重并保护你的个人数据，所有信息仅用于生成个人洞察。</p>
            <p>使用与免责说明：本产品基于东方易象体系与身心养生观，适合作为自我观察与生活参考，不构成医疗诊断或治疗建议。如有不适，请及时就医或咨询专业医生。</p>
          </div>
        </footer>
      </div>

      {/* 第七步：动态拍照模块 (Modal/Overlay) */}
      <div 
        id="camera-modal" 
        className={activeCameraMode ? "is-active" : ""}
        onClick={(e) => {
          // 如果点击的是模态框本身（不是子元素），关闭模态框
          if (e.target === e.currentTarget) {
            handleCameraClose();
          }
        }}
      >
        <div className="camera-panel-content">
          <div className="camera-header">
            <span className="camera-tip">
              {activeCameraMode === "palm"
                ? "请摊开手掌，保持在取景框内并光线均匀。"
                : "请伸出舌头，保持在取景框内并光线均匀。"}
            </span>
            <div className="camera-controls">
              <button 
                type="button"
                className="control-button icon-button"
                onClick={() => {
                  // TODO: 切换前后摄像头功能
                }}
              >
                <span className="icon">🔄</span>
                切换前后摄像头
              </button>
              <div className="slider-group">
                <label htmlFor="gallery-enhance-slider" className="slider-label">画廊增强</label>
                <input 
                  type="range" 
                  id="gallery-enhance-slider"
                  name="gallery-enhance"
                  min="0" 
                  max="100" 
                  defaultValue={50}
                  className="slider"
                  aria-label="画廊增强"
                />
              </div>
              <button 
                type="button"
                className="control-button icon-button close-camera-modal"
          onClick={handleCameraClose}
        >
                <span className="icon">✕</span>
                返回
              </button>
          </div>
        </div>
          <div className="camera-preview-area" style={{ position: 'relative', zIndex: 1 }}>
            <video 
              id="camera-video-feed" 
              ref={videoRef}
              autoPlay 
              playsInline={true}
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            ></video>
            <div className="overlay-frame" style={{ pointerEvents: 'none', zIndex: 1 }}></div>
          </div>
          <div 
            className="camera-capture-footer" 
            style={{ 
              position: 'relative', 
              zIndex: 10002, 
              pointerEvents: 'auto',
              isolation: 'isolate'
            }}
          >
            <button 
              type="button"
              className="capture-button"
              id="camera-capture-button"
              style={{ 
                position: 'relative', 
                zIndex: 10004,
                pointerEvents: 'auto',
                cursor: 'pointer',
                isolation: 'isolate',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'manipulation',
                display: 'block',
                visibility: 'visible',
                opacity: 1
              }}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                  // 在开始时保存当前模式，避免在异步回调中状态已改变
                  const currentMode = activeCameraMode;
                  if (!videoRef.current || !currentMode) {
                    setCameraMessage(
                      locale === "zh" ? "相机未就绪，请稍后再试" : "Camera not ready, please try again",
                    );
                    return;
                  }

                  const video = videoRef.current;
                  
                  // 检查视频尺寸是否有效
                  if (video.videoWidth === 0 || video.videoHeight === 0) {
                    setCameraMessage(
                      locale === "zh" ? "视频未加载完成，请稍后再试" : "Video not loaded, please wait",
                    );
                    return;
                  }

                  const canvas = document.createElement("canvas");
                  const context = canvas.getContext("2d");
                  if (!context) {
                    setCameraMessage(
                      locale === "zh" ? "无法创建画布，请重试" : "Cannot create canvas, please try again",
                    );
                    return;
                  }

                  // 设置画布尺寸为视频尺寸
                  // 使用视频的实际尺寸，但确保至少有一个合理的最小值
                  const videoWidth = video.videoWidth || 1280;
                  const videoHeight = video.videoHeight || 720;
                  
                  canvas.width = videoWidth;
                  canvas.height = videoHeight;

                  // 绘制视频帧到画布
                  context.drawImage(video, 0, 0, canvas.width, canvas.height);

                  // 转换为 Blob，然后转换为 File（提高质量以确保文件大小足够）
                  canvas.toBlob(
                    async (blob) => {
                      try {
                        // 再次检查模式是否仍然有效（用户可能在等待过程中关闭了相机）
                        if (!activeCameraMode || activeCameraMode !== currentMode) {
                          setCameraMessage(
                            locale === "zh" ? "相机已关闭" : "Camera was closed",
                          );
                          return;
                        }

                        if (!blob) {
                          // 失败时：只显示错误消息，不关闭模态框
                          setCameraMessage(
                            locale === "zh" ? "拍照失败，请重试" : "Capture failed, please try again",
                          );
                          return;
                        }

                        const fileType = "image/jpeg";
                        const extension = "jpg";
                        const fileName = `${currentMode}-${Date.now()}.${extension}`;
                        const file = new File([blob], fileName, { type: fileType });

                        // 调用确认处理函数，等待结果
                        const success = await handleCameraConfirm(currentMode)(file);
                        if (!success) {
                          // handleCameraConfirm 已经设置了错误消息
                          return;
                        }
                      } catch (error) {
                        setCameraMessage(
                          locale === "zh" ? "处理照片时出错，请重试" : "Error processing photo, please try again",
                        );
                      }
                    },
                    "image/jpeg",
                    0.95, // 提高质量参数以确保文件大小足够（至少50KB）
                  );
                } catch (error) {
                  setCameraMessage(
                    locale === "zh" ? "拍照时出错，请重试" : "Error capturing photo, please try again",
                  );
                }
              }}
            >
              拍照
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// 复用现有的 UploadField 组件（从 analyze/page.tsx 复制）
type UploadFieldProps = {
  label: string;
  hint: string;
  file: File | null;
  error?: string;
  locale: Locale;
  mode: "palm" | "tongue";
  capture: {
    upload: string;
    open: string;
    remove: string;
    preview: string;
    cameraUnavailable: string;
    desktopGuide: string | null;
    fallbackHint: string | null;
  };
  onSelectFile: (file: File | null) => Promise<boolean> | boolean;
  onRequestCamera?: () => boolean;
  cameraMessage?: string | null;
  convertErrorMessage: string;
  cameraGuide?: string | null;
  cameraFallback?: string | null;
};

function UploadField({
  label,
  hint,
  file,
  error,
  locale,
  mode,
  capture,
  onSelectFile,
  onRequestCamera,
  cameraMessage,
  convertErrorMessage,
  cameraGuide,
  cameraFallback,
}: UploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputId = useId();
  const cameraInputId = useId();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setConvertError(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const normalizeToJpeg = async (incoming: File): Promise<File | null> => {
    if (typeof window === "undefined") return incoming;
    if (!incoming.type || incoming.type === "image/jpeg" || incoming.type === "image/png") {
      return incoming;
    }
    if (!incoming.type.startsWith("image/")) return incoming;
    try {
      const convertWithBitmap = async () => {
        const bitmap = await createImageBitmap(incoming);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.drawImage(bitmap, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
        if (!blob) return null;
        return new File(
          [blob],
          `${incoming.name.replace(/\.[^/.]+$/, "") || mode}-${Date.now()}.jpg`,
          { type: "image/jpeg" },
        );
      };

      const convertWithImage = async () => {
        const url = URL.createObjectURL(incoming);
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
          });
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
          if (!blob) return null;
          return new File(
            [blob],
            `${incoming.name.replace(/\.[^/.]+$/, "") || mode}-${Date.now()}.jpg`,
            { type: "image/jpeg" },
          );
        } finally {
          URL.revokeObjectURL(url);
        }
      };

      if ("createImageBitmap" in window) {
        const converted = await convertWithBitmap();
        if (converted) {
          return converted;
        }
      }
      return await convertWithImage();
    } catch {
      return null;
    }
  };

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setConvertError(null);
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) {
      await onSelectFile(null);
      return;
    }
    const processed = await normalizeToJpeg(nextFile);
    if (!processed) {
      setConvertError(convertErrorMessage);
      await onSelectFile(null);
      if (event.target) {
        event.target.value = "";
      }
      return;
    }
    let success = false;
    try {
      const result = await onSelectFile(processed);
      success = Boolean(result);
    } catch (error) {
      // 忽略错误，已通过返回值处理
      success = false;
    }
    if (!success && event.target) {
      event.target.value = "";
    }
  };

  const handleRemove = () => {
    setConvertError(null);
    void onSelectFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
  };

  const handleOpenCamera = () => {
    setConvertError(null);
    const handled = onRequestCamera?.();
    if (handled) {
      return;
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const displayMessage = convertError ?? error ?? cameraMessage ?? null;

  return (
    <div className="space-y-3">
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed border-[var(--v2-color-border)] bg-[var(--v2-color-bg-paper)] px-6 py-8 text-center">
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3 w-full">
            <img
              src={previewUrl}
              alt={label}
              className="max-h-64 w-full rounded-xl object-cover shadow-md border border-[var(--v2-color-border)]"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--v2-color-green-primary)]">
                {capture.preview}
              </span>
              {file && (
                <span className="text-xs text-[var(--v2-color-text-muted)]">
                  {`${(file.size / 1024 / 1024).toFixed(2)}MB`}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-[var(--v2-color-text-secondary)] font-medium">
              {locale === "zh"
                ? "点击下方按钮上传或拍照"
                : "Click the button below to upload or take a photo"}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <input
            id={cameraInputId}
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleInputChange}
          />
          <label
            htmlFor={fileInputId}
            className="v2-button cursor-pointer flex-shrink-0"
          >
            {capture.upload}
          </label>
          <button
            type="button"
            onClick={handleOpenCamera}
            className="v2-button-secondary flex-shrink-0"
          >
            {capture.open}
          </button>
          {file ? (
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-xl border border-[var(--v2-color-border)] bg-white px-5 py-2 text-sm font-medium text-[var(--v2-color-text-secondary)] hover:bg-[var(--v2-color-bg-paper)] transition-colors"
            >
              {capture.remove}
            </button>
          ) : null}
        </div>
        {cameraGuide ? (
          <p className="text-xs text-[var(--v2-color-text-muted)] mt-2">{cameraGuide}</p>
        ) : null}
        {cameraFallback ? (
          <p className="text-xs text-[var(--v2-color-text-muted)] mt-2">{cameraFallback}</p>
        ) : null}
      </div>
      {displayMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2">
          <p className="text-sm text-amber-900">{displayMessage}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function V2AnalyzePage({ params }: PageProps) {
  const locale: Locale = params.locale === "en" ? "en" : "zh";
  
  return (
    <ErrorBoundary locale={locale}>
      <V2AnalyzePageContent params={params} />
    </ErrorBoundary>
  );
}

