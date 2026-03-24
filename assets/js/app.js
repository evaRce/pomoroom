// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import topbar from "../vendor/topbar"
import live_hooks from './live_hooks'

let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket("/live", Socket, {
  hooks: live_hooks,
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken}
})

const LOADER_ID = "page-loading-overlay"
const LOADER_DELAY_MS = 150
let loaderTimeout = null

const ensurePageLoader = () => {
  let loader = document.getElementById(LOADER_ID)

  if (loader) return loader

  loader = document.createElement("div")
  loader.id = LOADER_ID
  loader.className = "page-loading-overlay"
  loader.innerHTML = `
    <div class="page-loading-content" role="status" aria-live="polite">
      <div class="page-loading-spinner"></div>
      <p class="page-loading-text">Cargando página...</p>
    </div>
  `

  document.body.appendChild(loader)
  return loader
}

const showPageLoader = () => {
  const loader = ensurePageLoader()
  loader.classList.add("is-active")
}

const hidePageLoader = () => {
  const loader = document.getElementById(LOADER_ID)
  if (loader) loader.classList.remove("is-active")
}

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => {
  topbar.show(LOADER_DELAY_MS)
  if (loaderTimeout) clearTimeout(loaderTimeout)
  loaderTimeout = setTimeout(() => {
    showPageLoader()
  }, LOADER_DELAY_MS)
})
window.addEventListener("phx:page-loading-stop", _info => {
  if (loaderTimeout) {
    clearTimeout(loaderTimeout)
    loaderTimeout = null
  }
  topbar.hide()
  hidePageLoader()
})

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

