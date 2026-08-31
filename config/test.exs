import Config

# We don't run a server during test. If one is required,
# you can enable the server option below.
config :pomoroom, PomoroomWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4002],
  secret_key_base: "jtqKwfp8oHkTNqTBN7gKfDsHfXr1R/TiJiG6ZUW9wVckmwM6o0HhaCMDrL0bXvSQ",
  server: false

# Configure MongoDB
config :pomoroom, :db, database: "pomoroom_test", username: "mongo", password: "abc123."

config :pomoroom, dev_routes: true

# LiveKit configuration (same local dev server as config/dev.exs; see comments there)
config :pomoroom, :livekit,
  api_key: "devkey",
  api_secret: "secret",
  ws_port: 7443,
  ws_url: System.get_env("LIVEKIT_WS_URL"),
  admin_url: "http://localhost:7880"

# In test we don't send emails.
config :pomoroom, Pomoroom.Mailer, adapter: Swoosh.Adapters.Test

# Disable swoosh api client as it is only required for production adapters.
config :swoosh, :api_client, false

# Print only warnings and errors during test
config :logger, level: :warning

# Initialize plugs at runtime for faster test compilation
config :phoenix, :plug_init_mode, :runtime
