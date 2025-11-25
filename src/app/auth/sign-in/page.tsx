import { redirect } from "next/navigation";

export default function SignInRedirect() {
  // 默认重定向到中文登录页，实际使用时应该根据用户偏好或浏览器语言检测
  redirect("/zh/auth/sign-in");
}

