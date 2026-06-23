"use client";

import Link from "next/link";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type NavHeaderItem = {
  href: string;
  label: string;
};

type CursorPosition = {
  left: number;
  width: number;
  opacity: number;
};

export default function NavHeader({
  activeHref,
  items,
  onNavigate,
}: {
  activeHref: string;
  items: NavHeaderItem[];
  onNavigate?: () => void;
}) {
  const [position, setPosition] = useState<CursorPosition>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  return (
    <ul
      className="nav-header-pill"
      onMouseLeave={() => setPosition((previous) => ({ ...previous, opacity: 0 }))}
    >
      {items.map((item) => (
        <Tab
          key={item.href}
          active={activeHref === item.href}
          href={item.href}
          setPosition={setPosition}
          onNavigate={onNavigate}
        >
          {item.label}
        </Tab>
      ))}

      <Cursor position={position} />
    </ul>
  );
}

function Tab({
  active,
  children,
  href,
  onNavigate,
  setPosition,
}: {
  active: boolean;
  children: React.ReactNode;
  href: string;
  onNavigate?: () => void;
  setPosition: React.Dispatch<React.SetStateAction<CursorPosition>>;
}) {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <li
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) {
          return;
        }

        const { width } = ref.current.getBoundingClientRect();
        setPosition({
          width,
          opacity: 1,
          left: ref.current.offsetLeft,
        });
      }}
      className={cn("nav-header-tab", active && "nav-header-tab-active")}
    >
      <Link href={href} onClick={onNavigate}>
        {children}
      </Link>
    </li>
  );
}

function Cursor({ position }: { position: CursorPosition }) {
  return <motion.li animate={position} className="nav-header-cursor" />;
}
