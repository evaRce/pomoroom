defmodule Pomoroom.Users.UserPolicy do
	import Ecto.Changeset

	def enrich_for_registration(changeset) do
		changeset
		|> set_hash_password()
		|> set_timestamps()
		|> set_default_image()
	end

	def parse_duplicate_key_error(errmsg) do
		cond do
			String.contains?(errmsg, "email") ->
				%{email: "Este email ya está siendo usado"}

			String.contains?(errmsg, "nickname") ->
				%{nickname: "Este nickname ya está asociado a otra cuenta"}
		end
	end

	defp set_hash_password(changeset) do
		hashed_password =
			changeset
			|> fetch_field(:password)
			|> elem(1)
			|> Bcrypt.hash_pwd_salt()

		change(changeset, %{password: hashed_password})
	end

	defp set_timestamps(changeset) do
		now = NaiveDateTime.utc_now()
		change(changeset, %{inserted_at: now, updated_at: now})
	end

	defp set_default_image(changeset) do
		random_number = :rand.uniform(10)
		image = "/images/default_user/default_user-#{random_number}.svg"
		change(changeset, %{image_profile: image})
	end
end
