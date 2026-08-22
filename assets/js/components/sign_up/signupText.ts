import { useTranslation } from "react-i18next";

export default function useSignupText() {
  const { t } = useTranslation();

  return {
    homeButtonTitle: t("signupText.homeButtonTitle"),
    brand: {
      pomo: t("signupText.brandPomo"),
      room: t("signupText.brandRoom"),
    },
    welcome: t("signupText.welcome"),
    subtitle: t("signupText.subtitle"),
    form: {
      emailLabel: t("signupText.formEmailLabel"),
      emailRequired: t("signupText.formEmailRequired"),
      emailInvalid: t("signupText.formEmailInvalid"),
      passwordLabel: t("signupText.formPasswordLabel"),
      passwordRequired: t("signupText.formPasswordRequired"),
      passwordLength: t("signupText.formPasswordLength"),
      confirmPasswordLabel: t("signupText.formConfirmPasswordLabel"),
      confirmPasswordRequired: t("signupText.formConfirmPasswordRequired"),
      confirmPasswordMismatch: t("signupText.formConfirmPasswordMismatch"),
      nicknameLabel: t("signupText.formNicknameLabel"),
      nicknameTooltip: t("signupText.formNicknameTooltip"),
      nicknameRequired: t("signupText.formNicknameRequired"),
      nicknameInvalid: t("signupText.formNicknameInvalid"),
      nicknameLength: t("signupText.formNicknameLength"),
      submit: t("signupText.formSubmit"),
      haveAccountPrefix: t("signupText.formHaveAccountPrefix"),
      loginLink: t("signupText.formLoginLink"),
    },
  };
}
