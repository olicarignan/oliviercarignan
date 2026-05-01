import { useState } from "react";
import Link from "next/link";

import { ArrowIcon } from "@/components/ArrowIcon";
import { CopyIcon } from "@/components/CopyIcon";
import { CheckIcon } from "@/components/CheckIcon";

export const IconLink = ({ href, children, isExternal, isInternal, icon }) => {

  const [copyState, setCopyState] = useState("idle");

  if (isInternal) {
    return (
      <Link href={href} className="icon-link">
        <span className="icon-link__icon">{icon ?? <ArrowIcon/>}</span>
        <span className="icon-link__text">{children}</span>
      </Link>
    );
  }


  const copyTextToClipboard = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyState("copied");
      setTimeout(() => {
        setCopyState("copied-out");
        setTimeout(() => setCopyState("idle"), 500);
      }, 750);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  if (isExternal) {
    return (
      <a
        href={href}
        className="icon-link"
        target={"_blank"}
        rel={"noopener noreferrer"}
      >
        <span className="icon-link__icon"><ArrowIcon/></span>
        <span className="icon-link__text">{children}</span>
      </a>
    );
  }

  return (
    <div
      className={`icon-link${copyState !== "idle" ? ` ${copyState}` : ""}`}
      onClick={() => copyTextToClipboard(href)}
    >
      <span className="icon-link__icon icon--copy"><CopyIcon/></span>
      <span className="icon-link__icon icon--check"><CheckIcon/></span>
      <span className="icon-link__text">{children}</span>
    </div>
  );
};
