import { useState } from "react";

import { ArrowIcon } from "@/components/ArrowIcon";
import { CopyIcon } from "@/components/CopyIcon";
import { CheckIcon } from "@/components/CheckIcon";

export const IconLink = ({ href, children, isExternal }) => {

  const [isCopied, setIsCopied] = useState(false);

  const copyTextToClipboard = async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
      className={`icon-link ${isCopied ? " copied" : ""}`}
      onClick={() => copyTextToClipboard(href)}
    >
      <span className="icon-link__icon icon--copy"><CopyIcon/></span>
      <span className="icon-link__icon icon--check"><CheckIcon/></span>
      <span className="icon-link__text">{children}</span>
    </div>
  );
};
