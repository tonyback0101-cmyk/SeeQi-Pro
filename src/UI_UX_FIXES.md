# UI/UX 修复方案

## 🔧 需要修复的问题

### 1. Loading 状态
**问题**: 未实现 Loading UI
**修复**: 添加 Loading 状态管理和 UI 组件

### 2. Button 防连点
**问题**: 未实现防连点机制
**修复**: 添加 `isSubmitting` 状态和按钮禁用逻辑

### 3. Toast 全时可见
**问题**: 错误信息也会自动关闭
**修复**: 错误信息保持可见直到用户手动关闭

## 📝 修复代码

### 修复 1: 添加 Loading 状态

在 `V2AnalysisResultClient.tsx` 中添加：

```typescript
const [isLoading, setIsLoading] = useState(false);

// 在数据加载时
useEffect(() => {
  setIsLoading(true);
  // 模拟数据加载
  const timer = setTimeout(() => {
    setIsLoading(false);
  }, 100);
  return () => clearTimeout(timer);
}, [report]);

// 在 JSX 中添加
{isLoading && (
  <div className="loading-overlay">
    <div className="loading-spinner">
      {locale === "zh" ? "正在加载报告…" : "Loading report…"}
    </div>
  </div>
)}
```

### 修复 2: 添加 Button 防连点

在 `V2AnalysisResultClient.tsx` 中修改：

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleUnlockClick = async () => {
  if (isSubmitting) return; // 防连点
  if (!reportId) return;

  if (!isLoggedIn) {
    const callbackUrl = `/${effectiveLocale}/v2/analysis-result?reportId=${reportId}&intent=unlock`;
    router.push(`/${effectiveLocale}/auth/sign-in?redirect=${encodeURIComponent(callbackUrl)}`);
    return;
  }

  setIsSubmitting(true);
  try {
    const response = await fetch("/api/pay/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId,
        locale: effectiveLocale,
      }),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      window.location.href = data.url;
    } else if (data.alreadyUnlocked) {
      router.refresh();
    } else {
      const errorMessage = data.error || (effectiveLocale === "zh" ? "创建支付会话失败" : "Failed to create checkout session");
      setPaymentFeedback({ type: "error", message: errorMessage });
    }
  } catch (error) {
    console.error("[PAY] Checkout error", error);
    const errorMessage = effectiveLocale === "zh" ? "网络错误，请稍后重试" : "Network error, please try again";
    setPaymentFeedback({ type: "error", message: errorMessage });
  } finally {
    setIsSubmitting(false);
  }
};

// 在按钮中添加 disabled 属性
<button 
  disabled={isSubmitting} 
  onClick={handleUnlockClick}
  className={isSubmitting ? "opacity-50 cursor-not-allowed" : ""}
>
  {isSubmitting 
    ? (locale === "zh" ? "处理中..." : "Processing...")
    : (locale === "zh" ? "立即解锁" : "Unlock Now")
  }
</button>
```

### 修复 3: 改进 Toast 可见性

在 `PaymentFeedbackToast` 组件中修改：

```typescript
function PaymentFeedbackToast({
  feedback,
  onClose,
}: {
  feedback: { type: "error" | "success"; message: string };
  onClose: () => void;
}) {
  useEffect(() => {
    // 只有成功信息自动关闭，错误信息保持可见
    if (feedback.type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
    // 错误信息不自动关闭，需要用户手动关闭
  }, [feedback.type, onClose]);

  return (
    <div className={`payment-feedback-toast payment-feedback-toast--${feedback.type}`}>
      <span>{feedback.message}</span>
      <button type="button" onClick={onClose} aria-label="关闭">
        ×
      </button>
      {/* ... 样式 ... */}
    </div>
  );
}
```

## ✅ 检查清单

- [ ] 添加 Loading 状态管理
- [ ] 添加 Loading UI 组件
- [ ] 添加 `isSubmitting` 状态
- [ ] 在按钮中添加 `disabled` 属性
- [ ] 修改 Toast 自动关闭逻辑（仅成功信息自动关闭）

