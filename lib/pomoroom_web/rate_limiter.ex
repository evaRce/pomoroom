defmodule PomoroomWeb.RateLimiter do
  use Hammer, backend: :ets
end
