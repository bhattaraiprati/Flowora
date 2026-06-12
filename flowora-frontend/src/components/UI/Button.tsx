import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'sso';
  children: ReactNode;
}

export default function Button({ variant = 'primary', children, className = '', ...props }: ButtonProps) {
  const base = "w-full py-3.5 rounded-xl font-semibold transition-all active:scale-[0.985]";

  const styles = {
    primary: "bg-brand hover:bg-brand-dark text-white shadow-sm",
    secondary: "bg-white border border-gray-200 hover:border-brand text-gray-700",
    sso: "bg-white border border-gray-200 hover:border-brand text-gray-700 flex items-center justify-center gap-3",
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}