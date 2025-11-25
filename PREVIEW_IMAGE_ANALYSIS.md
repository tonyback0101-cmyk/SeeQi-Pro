# 掌纹/舌苔预览图片 JSX 分析报告

## 1. 预览图片 JSX 位置

### 1.1 实际使用的预览（当前页面）

**文件路径：** `src/app/[locale]/v2/analyze/page.tsx`

**位置：** 第1371-1373行（掌纹）、第1426-1428行（舌苔）

**JSX 代码：**
```typescript
// 掌纹文件名显示（第1371-1373行）
<span className="file-name" id="palm-image-name">
  {palmFile ? palmFile.name : "未选择文件"}
</span>

// 舌苔文件名显示（第1426-1428行）
<span className="file-name" id="tongue-image-name">
  {tongueFile ? tongueFile.name : "未选择文件"}
</span>
```

**⚠️ 注意：** 当前页面**没有显示预览图片**，只显示文件名。

### 1.2 未使用的预览组件（UploadField）

**文件路径：** `src/app/[locale]/v2/analyze/page.tsx`

**位置：** 第1891-1897行（UploadField 组件内部）

**JSX 代码：**
```typescript
// UploadField 组件中的预览图片（第1891-1897行）
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
  // 无预览时的占位内容
)}
```

**⚠️ 注意：** `UploadField` 组件虽然定义了，但**在页面中没有被使用**。

---

## 2. 预览依赖的 state/props

### 2.1 当前页面使用的状态

**掌纹：**
- **State 名称：** `palmFile`
- **类型：** `File | null`
- **定义位置：** 第69行
- **Setter：** `setPalmFile`
- **使用位置：** 第1372行（显示文件名）

**舌苔：**
- **State 名称：** `tongueFile`
- **类型：** `File | null`
- **定义位置：** 第70行
- **Setter：** `setTongueFile`
- **使用位置：** 第1427行（显示文件名）

### 2.2 UploadField 组件中的状态（未使用）

**预览 URL：**
- **State 名称：** `previewUrl`
- **类型：** `string | null`
- **定义位置：** 第1751行（UploadField 组件内部）
- **Setter：** `setPreviewUrl`
- **生成方式：** 通过 `URL.createObjectURL(file)` 从 `file` prop 生成（第1758-1769行）

**文件：**
- **Prop 名称：** `file`
- **类型：** `File | null`
- **来源：** 从父组件传入（UploadField 的 props）

---

## 3. 拍照回调写入的字段对比

### 3.1 拍照回调流程

**从 handleCapture 到最终状态的数据流：**

```
拍照按钮 onClick (第1655行)
  ↓
canvas.toBlob() 成功
  ↓
handleCameraConfirm(activeCameraMode)(file) (第1695行)
  ↓
handleSelectPalm(file) 或 handleSelectTongue(file) (第451行)
  ↓
selectPalmFile(file) 或 selectTongueFile(file) (第346行、第364行)
  ↓
setPalmFile(file) 或 setTongueFile(file) (第310-311行)
```

### 3.2 字段命名对比

| 阶段 | 函数/方法 | 写入的字段 | 位置 |
|------|----------|-----------|------|
| 拍照回调 | `handleCameraConfirm` | 调用 `handleSelectPalm`/`handleSelectTongue` | 第451行 |
| 文件选择处理 | `handleSelectPalm`/`handleSelectTongue` | 调用 `selectPalmFile`/`selectTongueFile` | 第346行、第364行 |
| 文件选择器 | `selectPalmFile`/`selectTongueFile` | 调用 `setPalmFile`/`setTongueFile` | 第310-311行 |
| 最终状态 | `setPalmFile`/`setTongueFile` | `palmFile`/`tongueFile` | 第69-70行 |
| 预览显示 | JSX | 读取 `palmFile.name`/`tongueFile.name` | 第1372行、第1427行 |

**✅ 命名一致性检查：**
- ✅ `handleSelectPalm` → `selectPalmFile` → `setPalmFile` → `palmFile` ✅ **命名一致**
- ✅ `handleSelectTongue` → `selectTongueFile` → `setTongueFile` → `tongueFile` ✅ **命名一致**

### 3.3 回调函数详细分析

**handleCameraConfirm（第449-467行）：**
```typescript
const handleCameraConfirm = (mode: "palm" | "tongue") => async (file: File) => {
  console.log("[Camera] handleCameraConfirm called, mode:", mode, "file:", file);
  const handler = mode === "palm" ? handleSelectPalm : handleSelectTongue;
  const success = await handler(file);  // ✅ 调用 handleSelectPalm 或 handleSelectTongue
  console.log("[Camera] handleCameraConfirm success:", success);
  if (!success) {
    setCameraMessage(
      locale === "zh" ? "照片不够清晰，再试一次吧～" : "The capture wasn't clear enough, please try again.",
    );
    return;
  }
  // 更新文件名显示
  const fileNameSpan = document.getElementById(mode === "palm" ? "palm-image-name" : "tongue-image-name");
  if (fileNameSpan) {
    fileNameSpan.textContent = file.name;  // ✅ 直接更新 DOM，不依赖 React 状态
  }
  setCameraMessage(null);
  setActiveCameraMode(null);
};
```

**handleSelectPalm（第334-350行）：**
```typescript
const handleSelectPalm = async (file: File | null): Promise<boolean> => {
  console.log("[FileChange] handleSelectPalm called, file:", file?.name);
  if (!file) {
    const result = selectPalmFile(null);  // ✅ 调用 selectPalmFile
    setStatusMessage("");
    return result;
  }
  const quality = await validateImageQuality(file);
  if (!quality.ok && "reason" in quality) {
    setStatusMessage(getQualityMessage("palm", quality.reason));
    return false;
  }
  const result = selectPalmFile(file);  // ✅ 调用 selectPalmFile
  setStatusMessage("");
  console.log("[FileChange] handleSelectPalm success:", result);
  return result;
};
```

**selectPalmFile（第310行）：**
```typescript
const selectPalmFile = makeFileSelector("palm", setPalmFile);  // ✅ 使用 setPalmFile
```

**makeFileSelector（第280-308行）：**
```typescript
const makeFileSelector = (field: FieldErrorKey, setter: (file: File | null) => void) =>
  (file: File | null): boolean => {
    // ... 验证逻辑 ...
    setter(file);  // ✅ 调用 setter（即 setPalmFile 或 setTongueFile）
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    return true;
  };
```

---

## 4. 数据路径和调用链

### 4.1 完整数据流图

```
┌─────────────────────────────────────────────────────────────────┐
│ 拍照按钮 onClick (第1655-1700行)                                │
│ - 依赖: videoRef.current, activeCameraMode                       │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ canvas.toBlob() 回调 (第1680-1699行)                            │
│ - 生成: File 对象                                                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleCameraConfirm(activeCameraMode)(file) (第1695行)          │
│ - 参数: mode ("palm" | "tongue"), file (File)                   │
│ - 回调函数: handleSelectPalm 或 handleSelectTongue              │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ handleSelectPalm(file) 或 handleSelectTongue(file) (第451行)     │
│ - 参数: file (File | null)                                       │
│ - 验证: validateImageQuality(file)                               │
│ - 回调: selectPalmFile(file) 或 selectTongueFile(file)           │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ selectPalmFile(file) 或 selectTongueFile(file) (第346/364行)     │
│ - 参数: file (File | null)                                       │
│ - 验证: 文件类型、文件大小                                        │
│ - 回调: setPalmFile(file) 或 setTongueFile(file)                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ setPalmFile(file) 或 setTongueFile(file) (第310-311行)           │
│ - 更新状态: palmFile 或 tongueFile                                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ React 状态更新触发重新渲染                                         │
│ - palmFile 或 tongueFile 状态变化                                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│ JSX 渲染 (第1372行、第1427行)                                     │
│ - 读取: palmFile.name 或 tongueFile.name                         │
│ - 显示: 文件名文本（当前没有预览图片）                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 组件层级和数据存储

```
V2AnalyzePage (第1976行)
  └─ ErrorBoundary (第1980行)
      └─ V2AnalyzePageContent (第63行)
          ├─ State 存储层:
          │   ├─ palmFile (第69行) ← setPalmFile
          │   └─ tongueFile (第70行) ← setTongueFile
          │
          ├─ 函数层:
          │   ├─ handleCameraConfirm (第449行)
          │   ├─ handleSelectPalm (第334行)
          │   ├─ handleSelectTongue (第352行)
          │   ├─ selectPalmFile (第310行)
          │   └─ selectTongueFile (第311行)
          │
          └─ 渲染层:
              ├─ 掌纹卡片 (第1340-1392行)
              │   └─ 文件名显示 (第1371-1373行)
              │       └─ {palmFile ? palmFile.name : "未选择文件"}
              │
              └─ 舌苔卡片 (第1394-1447行)
                  └─ 文件名显示 (第1426-1428行)
                      └─ {tongueFile ? tongueFile.name : "未选择文件"}
```

### 4.3 字段名映射表

| 阶段 | 函数/方法 | 输入参数 | 输出/写入字段 | 位置 |
|------|----------|---------|--------------|------|
| 1. 拍照 | `onClick` | - | `file` (File) | 第1655行 |
| 2. 回调 | `handleCameraConfirm` | `mode`, `file` | 调用 `handler(file)` | 第451行 |
| 3. 处理 | `handleSelectPalm` | `file` | 调用 `selectPalmFile(file)` | 第346行 |
| 4. 选择 | `selectPalmFile` | `file` | 调用 `setPalmFile(file)` | 第310行 |
| 5. 状态 | `setPalmFile` | `file` | 更新 `palmFile` state | 第69行 |
| 6. 渲染 | JSX | 读取 `palmFile` | 显示 `palmFile.name` | 第1372行 |

**舌苔流程相同，只是字段名从 `palm` 改为 `tongue`。**

---

## 5. 关键发现

### 5.1 预览图片显示

**⚠️ 当前页面没有显示预览图片**

- ✅ 定义了 `UploadField` 组件，其中包含预览图片的 JSX（第1893-1897行）
- ❌ 但页面中**没有使用** `UploadField` 组件
- ✅ 页面中只显示文件名：`{palmFile ? palmFile.name : "未选择文件"}`

### 5.2 数据路径一致性

**✅ 字段命名完全一致**

- `handleSelectPalm` → `selectPalmFile` → `setPalmFile` → `palmFile` ✅
- `handleSelectTongue` → `selectTongueFile` → `setTongueFile` → `tongueFile` ✅

### 5.3 状态存储位置

**所有状态都在 `V2AnalyzePageContent` 组件中：**
- `palmFile` / `tongueFile` state（第69-70行）
- 所有处理函数（第334-467行）
- 所有渲染逻辑（第1340-1447行）

**没有跨组件传递，所有逻辑都在同一组件内。**

### 5.4 预览 URL 生成（未使用）

**UploadField 组件中的预览 URL 生成逻辑（第1758-1769行）：**
```typescript
useEffect(() => {
  if (!file) {
    setPreviewUrl(null);
    setConvertError(null);
    return;
  }
  const url = URL.createObjectURL(file);  // ✅ 从 file prop 生成预览 URL
  setPreviewUrl(url);
  return () => {
    URL.revokeObjectURL(url);
  };
}, [file]);
```

**⚠️ 注意：** 这个逻辑在 `UploadField` 组件内部，但该组件**没有被使用**。

---

## 6. 总结

### 6.1 预览图片 JSX

- **实际使用：** ❌ **没有预览图片，只有文件名显示**
- **未使用组件：** `UploadField` 组件中定义了预览图片 JSX（第1893-1897行）

### 6.2 状态依赖

- **掌纹：** `palmFile` (File | null) - 第69行
- **舌苔：** `tongueFile` (File | null) - 第70行

### 6.3 字段命名一致性

- ✅ **完全一致**：从 `handleCameraConfirm` → `handleSelectPalm/Tongue` → `selectPalmFile/TongueFile` → `setPalmFile/TongueFile` → `palmFile/tongueFile`

### 6.4 数据路径

**单组件内完整流程：**
```
拍照 → handleCameraConfirm → handleSelectPalm/Tongue → selectPalmFile/TongueFile → setPalmFile/TongueFile → palmFile/tongueFile → JSX 渲染文件名
```

**所有逻辑都在 `V2AnalyzePageContent` 组件内，没有跨组件传递。**

