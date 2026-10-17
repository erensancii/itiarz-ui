"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import NextLink from "next/link";
import type { ReactNode } from "react";

type LinkButtonProps = Pick<ButtonProps, "variant" | "color" | "size" | "sx" | "startIcon"> & {
  href: string;
  children: ReactNode;
};

/**
 * MUI Button that navigates with Next's client router. A client component, so server pages can use
 * it: they may not pass `component={NextLink}` (a function) to MUI themselves.
 */
export function LinkButton({ href, children, ...props }: LinkButtonProps) {
  return <Button component={NextLink} href={href} {...props}>{children}</Button>;
}
