import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function Button({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}