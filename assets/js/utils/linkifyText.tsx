import React from "react";

const URL_SPLIT_REGEX = /(https?:\/\/[^\s]+)/g;
const URL_MATCH_REGEX = /^https?:\/\/[^\s]+$/;
const TRAILING_PUNCTUATION_REGEX = /[).,!?;:'"\]}]+$/;

export function linkifyText(text: string) {
  const parts = text.split(URL_SPLIT_REGEX);

  return parts.map((part, index) => {
    if (!URL_MATCH_REGEX.test(part)) {
      return part;
    }

    const trailingMatch = part.match(TRAILING_PUNCTUATION_REGEX);
    const trailing = trailingMatch?.[0] ?? "";
    const url = trailing ? part.slice(0, -trailing.length) : part;

    return (
      <React.Fragment key={index}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
          onClick={(event) => event.stopPropagation()}
        >
          {url}
        </a>
        {trailing}
      </React.Fragment>
    );
  });
}
