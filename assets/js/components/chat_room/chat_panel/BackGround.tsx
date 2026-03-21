import React from "react";

export default function BackGround({ imageNumber }) {
  return (
    <div className="flex flex-col flex-grow w-full border-l border-r justify-center items-center">
      <img
        src={`/images/background2/background-${imageNumber}.svg`}
        alt="background"
        className="object-cover w-full h-full opacity-70"
      />
    </div>
  );
}
