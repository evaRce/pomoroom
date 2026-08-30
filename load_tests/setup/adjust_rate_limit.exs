target = System.get_env("TARGET_NODE") |> String.to_atom()
cookie = System.get_env("TARGET_COOKIE") |> String.to_atom()
config_key = System.get_env("CONFIG_KEY", "login_rate_limit") |> String.to_atom()
max_attempts = System.get_env("MAX_ATTEMPTS", "3") |> String.to_integer()
scale_ms = System.get_env("SCALE_MS", "60000") |> String.to_integer()

Node.set_cookie(cookie)
true = Node.connect(target)
Process.sleep(300)

:ok =
  :rpc.call(target, Application, :put_env, [
    :pomoroom,
    config_key,
    [max_attempts: max_attempts, scale_ms: scale_ms]
  ])

IO.puts("#{config_key} en #{target} -> max_attempts=#{max_attempts} scale_ms=#{scale_ms}")
