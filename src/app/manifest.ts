import type { MetadataRoute } from "next";

/**
 * 根据当前路径的 locale 动态生成 Manifest
 * Next.js 的 manifest 路由不支持参数，但可以通过 headers 获取当前路径
 */
export default function manifest(): MetadataRoute.Manifest {
  // 从环境变量或默认值获取 locale（优先使用默认中文）
  // 注意：Next.js manifest 路由无法直接获取请求参数，使用默认值
  // 实际运行时，浏览器会根据当前页面的 lang 属性自动匹配
  const defaultLocale = "zh";
  
  const manifestByLocale: Record<string, MetadataRoute.Manifest> = {
    zh: {
      name: "SeeQi · 东方玄学洞察系统",
      short_name: "SeeQi",
      description: "基于掌纹、舌象、体质、梦境与气运的综合分析",
      lang: "zh-CN",
      start_url: "/zh",
      display: "standalone",
      background_color: "#0D1B2A",
      theme_color: "#0D1B2A",
      icons: [
        // 暂时移除图标引用，避免无效图标阻塞页面渲染和 hydration
        // TODO: 修复图标文件后重新启用
        // {
        //   src: "/icons/icon-192.png",
        //   sizes: "192x192",
        //   type: "image/png",
        //   purpose: "any",
        // },
        // {
        //   src: "/icons/icon-192.png",
        //   sizes: "192x192",
        //   type: "image/png",
        //   purpose: "maskable",
        // },
        // {
        //   src: "/icons/icon-512.png",
        //   sizes: "512x512",
        //   type: "image/png",
        //   purpose: "any",
        // },
        // {
        //   src: "/icons/icon-512.png",
        //   sizes: "512x512",
        //   type: "image/png",
        //   purpose: "maskable",
        // },
      ],
      dir: "ltr",
      categories: ["lifestyle", "health", "wellness"],
    },
    en: {
      name: "SeeQi · Eastern Insight System",
      short_name: "SeeQi",
      description: "Comprehensive analysis based on palmistry, tongue diagnosis, constitution, dreams, and qi rhythm",
      lang: "en-US",
      start_url: "/en",
      display: "standalone",
      background_color: "#0D1B2A",
      theme_color: "#0D1B2A",
      icons: [
        // 暂时移除图标引用，避免无效图标阻塞页面渲染和 hydration
        // TODO: 修复图标文件后重新启用
        // {
        //   src: "/icons/icon-192.png",
        //   sizes: "192x192",
        //   type: "image/png",
        //   purpose: "any",
        // },
        // {
        //   src: "/icons/icon-192.png",
        //   sizes: "192x192",
        //   type: "image/png",
        //   purpose: "maskable",
        // },
        // {
        //   src: "/icons/icon-512.png",
        //   sizes: "512x512",
        //   type: "image/png",
        //   purpose: "any",
        // },
        // {
        //   src: "/icons/icon-512.png",
        //   sizes: "512x512",
        //   type: "image/png",
        //   purpose: "maskable",
        // },
      ],
      dir: "ltr",
      categories: ["lifestyle", "health", "wellness"],
    },
  };

  // 返回默认 locale 的 manifest（中文）
  // 注意：由于 Next.js manifest 路由的限制，无法动态获取当前 locale
  // 实际使用时，浏览器会根据当前页面的 lang 属性自动匹配
  return manifestByLocale[defaultLocale] || manifestByLocale.zh;
}

