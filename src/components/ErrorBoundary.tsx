"use client";

import React, { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  locale?: "zh" | "en";
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

/**
 * ErrorBoundary 组件
 * 用于捕获子组件树中的 JavaScript 错误，记录这些错误，并显示降级 UI
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误到错误报告服务
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
    
    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 否则显示默认的错误 UI
      const locale = this.props.locale ?? "zh";
      const t = {
        zh: {
          title: "出现了一些问题",
          message: "抱歉，页面加载时出现了错误。请刷新页面重试。",
          refresh: "刷新页面",
          back: "返回首页",
        },
        en: {
          title: "Something went wrong",
          message: "Sorry, an error occurred while loading the page. Please refresh and try again.",
          refresh: "Refresh Page",
          back: "Back to Home",
        },
      }[locale];

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f4] px-4 py-8">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">{t.title}</h1>
              <p className="mt-2 text-sm text-gray-600">{t.message}</p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 rounded bg-gray-100 p-3">
                <p className="text-xs font-mono text-red-600">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-gray-500">
                      {locale === "zh" ? "查看错误堆栈" : "View Stack Trace"}
                    </summary>
                    <pre className="mt-2 overflow-auto text-xs text-gray-600">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
              >
                {locale === "zh" ? "重试" : "Retry"}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.refresh}
              </button>
              <a
                href="/"
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t.back}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

