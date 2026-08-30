defmodule PomoroomWeb.RateLimiter do
  use Hammer, backend: :ets, algorithm: :sliding_window
end
