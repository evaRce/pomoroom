import React from "react";
import useChatPanelText from "./chatPanelText";

export default function BackGround({ imageNumber }: { imageNumber: number }) {
  const chatPanelText = useChatPanelText();
  return (
    <div className="flex flex-col flex-grow w-full border-l border-r justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt={chatPanelText.background.alt}
        className="object-cover w-full h-full opacity-70"
      />
    </div>
  );
}
