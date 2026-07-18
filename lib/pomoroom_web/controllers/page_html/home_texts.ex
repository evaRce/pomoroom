defmodule PomoroomWeb.PageHTML.HomeTexts do
  @moduledoc """
  Centralizes the copy shown on the home page, so it lives in one place
  ahead of internationalization.
  """

  def texts do
    %{
      nav: %{
        language: "ES",
        language_aria: "Cambiar idioma",
        login: "Iniciar sesión",
        signup: "Registrarse"
      },
      hero: %{
        title_pomoroom: "Pomoroom",
        tagline: "Conecta. Colabora. Crea.",
        description: "Una plataforma de mensajería moderna con herramientas de productividad",
        subtext_prefix: "POMOROOM es tu espacio para estudiar y/o trabajar con enfoque, ya sea",
        subtext_suffix: "o en grupo.",
        solo_variants: ["solo", "sola", "sole"]
      },
      features: %{
        chats_private: %{title: "Chats Privados", description: "Conversaciones seguras 1 a 1"},
        chats_group: %{title: "Chats Grupales", description: "Colabora con tu equipo"},
        calls: %{title: "Voz y Video", description: "Llamadas WebRTC"},
        plugins: %{title: "Plugins", description: "Temporizador Pomodoro y tablero Kanban"}
      },
      showcase: %{
        title: "Así se ve Pomoroom",
        prev_label: "Previous",
        next_label: "Next",
        image_alt: "Captura de Pomoroom",
        image_alt_zoomed: "Captura de Pomoroom ampliada",
        zoom_label: "Ampliar imagen",
        close_label: "Cerrar"
      }
    }
  end
end
