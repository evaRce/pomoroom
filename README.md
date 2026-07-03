# Pomoroom

Pomoroom is a web application designed to enhance productivity and time management by integrating the Pomodoro technique with collaborative tools. This platform allows users to study or work together through virtual rooms equipped with features such as text chat, one-on-one video calls, and a personal timer.

## Technologies used

- **Frontend**: React, Tailwind CSS, Ant Design, DaisyUI.
- **Backend**: Elixir with Phoenix LiveView.
- **Database**: MongoDB.
- **Real-time connections**: WebRTC for video calls and Phoenix.PubSub for real-time updates.
- **Infrastructure**: Modular design and concurrent processes using GenServer.

## Installation

Follow these steps to set up the project in your local environment:
> **Note**: *This setup has only been tested on Linux.*

### Prerequisites

Make sure you have the following installed on your system:

- [Elixir and Erlang](https://elixir-lang.org/install.html#gnulinux)
- [Docker](https://docs.docker.com/desktop/setup/install/linux/)

### Setup Instructions

1. **Clone the repository**:
   ```bash
	git clone git@github.com:evaRce/pomoroom.git
	cd pomoroom
   
2. **Install dependencies**:
   ```bash
	cd assets
	npm install
	cd ..
	mix deps.get
	
3. **Generate a self-signed TLS certificate** (needed for HTTPS in dev, and mounted into the LiveKit TLS proxy container in the next step, so generate it first):
   ```bash
   mix phx.gen.cert

> **Note**: This creates `priv/cert/selfsigned.pem` and `priv/cert/selfsigned_key.pem`, already referenced by `config/dev.exs`.

4. **Start all containers** (MongoDB, LiveKit — the SFU used for group video calls — and its TLS proxy):
   ```bash
   docker-compose up -d

> **Note**: LiveKit runs in `--dev` mode using the default credentials (`devkey` / `secret`), already configured in `config/dev.exs`.  
> The app is served over HTTPS, so browsers block plain `ws://` connections for any host other than `localhost` — the TLS proxy (`livekit-tls` service) is required, not optional, even when testing with two tabs on the same machine, since `config/dev.exs` always points calls at the proxy's `wss://` port.  
> How strictly a device enforces the self-signed certificate varies: on some devices/browsers the call connects with no extra step, on others you may see a certificate warning for the LiveKit ports (`https://your-lan-ip:7880` / `:7443`) that you'll need to accept once. If a call gets stuck on "Conectando…" from another device, try that first.

5. **Start the app**:
   ```bash
   mix phx.server	# or	 iex -S mix phx.server


Now you can visit [`localhost:4000`](http://localhost:4000/) from your browser.
