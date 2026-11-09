"use client";

import Nav from "@/components/Nav";

export default function Layout({ children }) {
  return (
    <div className="subgrid app">
      <Nav />
      {children}
    </div>
  );
}
