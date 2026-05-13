"use client";

import { sendGAEvent } from "@next/third-parties/google";
import type { AnchorHTMLAttributes, ReactNode } from "react";

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "onClick"> {
  eventName: string;
  eventParams?: Record<string, string | number | boolean>;
  children: ReactNode;
}

export default function TrackedLink({
  eventName,
  eventParams,
  children,
  ...rest
}: Props) {
  return (
    <a
      {...rest}
      onClick={() => {
        sendGAEvent("event", eventName, eventParams ?? {});
      }}
    >
      {children}
    </a>
  );
}
