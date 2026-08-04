import { useTranslation } from "react-i18next";

export default function useCallText() {
  const { t } = useTranslation();

  return {
    button: {
      showRoom: t("callText.button.showRoom"),
      anotherCallActive: t("callText.button.anotherCallActive"),
      joinRoom: t("callText.button.joinRoom"),
      connecting: t("callText.button.connecting"),
    },

    connection: {
      joinNotAllowed: t("callText.connection.joinNotAllowed"),
      joinUnreachable: t("callText.connection.joinUnreachable"),
      joinFailed: t("callText.connection.joinFailed"),
      callDropped: t("callText.connection.callDropped"),
    },

    screen: {
      roomTitle: (roomName: string) =>
        roomName
          ? t("callText.screen.roomTitleWithName", { roomName })
          : t("callText.screen.roomTitleDefault"),
      participantsCount: (count: number) => t("callText.screen.participantsCount", { count }),
      you: t("callText.screen.you"),
      muteMic: t("callText.screen.muteMic"),
      unmuteMic: t("callText.screen.unmuteMic"),
      turnOffCamera: t("callText.screen.turnOffCamera"),
      turnOnCamera: t("callText.screen.turnOnCamera"),
      switchCamera: t("callText.screen.switchCamera"),
      startScreenShare: t("callText.screen.startScreenShare"),
      stopScreenShare: t("callText.screen.stopScreenShare"),
      screenShareBlocked: t("callText.screen.screenShareBlocked"),
      screenShareConflict: t("callText.screen.screenShareConflict"),
      screenShareFailed: t("callText.screen.screenShareFailed"),
      endCall: t("callText.screen.endCall"),
      enterFullscreen: t("callText.screen.enterFullscreen"),
      exitFullscreen: t("callText.screen.exitFullscreen"),
      close: t("callText.screen.close"),
      overflowUnit: (count: number) => t("callText.screen.overflowUnit", { count }),
    },

    minibar: {
      callInProgress: t("callText.minibar.callInProgress"),
    },
  };
}
