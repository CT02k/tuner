import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "option"
type ButtonSize = "icon" | "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  border?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const baseClassName =
  "cursor-pointer inline-flex items-center justify-center font-semibold transition-all hover:brightness-95 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"

const variantClassNames: Record<ButtonVariant, string> = {
  primary: "bg-green-500 text-white border-green-600",
  secondary: "border border-green-200 bg-green-50 text-green-950",
  outline: "border border-green-200 bg-white text-green-950",
  ghost: "border border-green-100 bg-white/80 text-green-900",
  danger: "bg-red-500 text-white hover:brightness-95",
  option: "relative text-center flex-col items-center text-white",
}

const sizeClassNames: Record<ButtonSize, string> = {
  icon: "h-9 w-9 rounded-full text-lg",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "rounded-2xl px-4 py-3 text-base",
}

function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ")
}

export default function Button({
  children,
  className,
  fullWidth = false,
  size = "md",
  type = "button",
  variant = "primary",
  border = true,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        baseClassName,
        variantClassNames[variant],
        sizeClassNames[size],
        fullWidth && "w-full",
        variant !== "option" &&
          border &&
          "border-b-4 border-r-4 active:border-0",
        className,
      )}
      {...props}
    >
      {children}
      {variant === "option" && (
        <>
          <img
            src="/idk.svg"
            alt=""
            className="absolute w-auto h-20 right-0 bottom-0"
          />
          <img
            src="/idk.svg"
            alt=""
            className="absolute w-auto h-20 left-0 top-0 rotate-180"
          />
        </>
      )}
    </button>
  )
}
