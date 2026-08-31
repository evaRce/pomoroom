import React from "react";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import MessageItem from "./MessageItem";

const baseMessage = {
  data: {
    from_user: "alice",
    text: "hola, ¿cómo vas?",
    inserted_at: new Date().toISOString(),
  },
};

describe("MessageItem accessibility", () => {
  it("has no accessibility violations for a message from another user", async () => {
    const { container } = render(
      <MessageItem message={baseMessage} userLogin={{ nickname: "bob" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for the current user's own message", async () => {
    const { container } = render(
      <MessageItem message={baseMessage} userLogin={{ nickname: "alice" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations when the sender has a profile image", async () => {
    const messageWithImage = {
      ...baseMessage,
      image_user: "/images/avatars/avatar-1.png",
    };
    const { container } = render(
      <MessageItem message={messageWithImage} userLogin={{ nickname: "bob" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for a system message", async () => {
    const systemMessage = {
      data: {
        from_user: "pomodoro",
        text: "El ciclo de trabajo ha terminado",
        inserted_at: new Date().toISOString(),
      },
    };
    const { container } = render(
      <MessageItem message={systemMessage} userLogin={{ nickname: "bob" }} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
