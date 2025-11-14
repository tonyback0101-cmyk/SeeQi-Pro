import { forwardRef } from "react";
import Link from "next/link";
import type { ColorToken } from "@/lib/colors";
import { COLORS } from "@/lib/colors";

type Variant = "primary" | "secondary" | "ghost";
type Size = "small" | "medium" | "large";

const sizeStyles: Record<Size, { padding: string; fontSize: string }> = {
  small: {
    padding: "0.4rem 1rem",
    fontSize: "0.9rem",
  },
  medium: {
    padding: "0.65rem 1.5rem",
    fontSize: "1rem",
  },
  large: {
    padding: "0.9rem 2.2rem",
    fontSize: "1.1rem",
  },
};

const variantColorMap: Record<Variant, ColorToken> = {
  primary: "primary" as ColorToken,
  secondary: "secondary" as ColorToken,
  ghost: "primary" as ColorToken,
};

const baseStyle: React.CSSProperties = {
  borderRadius: "999px",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  border: "1px solid transparent",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease",
  textDecoration: "none",
  boxShadow: "0 10px 18px rgba(0, 0, 0, 0.12)",
};

const getVariantStyles = (variant: Variant, color: ColorToken): React.CSSProperties => {
  if (variant === "ghost") {
    const colorValue = color === "primary" ? COLORS.primary.qingzhu : color === "secondary" ? COLORS.secondary.gold : "#8DAE92";
    return {
      backgroundColor: "transparent",
      color: colorValue,
      border: "none",
      boxShadow: "none",
    };
  }

  if (variant === "secondary") {
    return {
      backgroundColor: COLORS.secondary.gold,
      color: "#2C3E30",
      boxShadow: "0 10px 18px rgba(198, 169, 105, 0.3)",
    };
  }

  const bgColor = color === "primary" ? COLORS.primary.qingzhu : color === "secondary" ? COLORS.secondary.gold : "#8DAE92";
  return {
    backgroundColor: bgColor,
    color: "#fff",
  };
};

type BaseProps = {
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

type ButtonProps = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    href?: never;
  };

type LinkButtonProps = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    href: string;
  };

const Spinner = () => (
  <>
    <span
      aria-hidden
      style={{
        width: "1.1rem",
        height: "1.1rem",
        borderRadius: "50%",
        border: "2px solid rgba(255, 255, 255, 0.6)",
        borderTopColor: "#fff",
        display: "inline-block",
        animation: "seeqi-spin 1s linear infinite",
      }}
    />
    <style jsx>{`
      @keyframes seeqi-spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `}</style>
  </>
);

const createStyles = (variant: Variant, size: Size): React.CSSProperties => {
  const colorToken = variantColorMap[variant];
  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...getVariantStyles(variant, colorToken),
  };
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { size = "medium", variant = "primary", disabled = false, loading = false, className, style, children, ...rest },
  ref,
) {
  const composedStyle: React.CSSProperties = {
    ...createStyles(variant, size),
    ...style,
    opacity: disabled || loading ? 0.65 : 1,
    cursor: disabled || loading ? "not-allowed" : "pointer",
  };

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      style={composedStyle}
      disabled={disabled || loading}
      aria-busy={loading}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </button>
  );
});

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(function LinkButton(
  { size = "medium", variant = "primary", disabled = false, loading = false, className, style, children, href, ...rest },
  ref,
) {
  const composedStyle: React.CSSProperties = {
    ...createStyles(variant, size),
    ...style,
    pointerEvents: disabled || loading ? "none" : "auto",
    opacity: disabled || loading ? 0.65 : 1,
  };

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      style={composedStyle}
      aria-disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner />}
      <span>{children}</span>
    </Link>
  );
});

