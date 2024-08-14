import 'vite/modulepreload-polyfill'
import './style.css'
import okPng from "./ok.png";

document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
  <pre>import okPng from "./ok.png"</pre>
  <img src="${okPng}" alt="NOT OK" width="30" />
  <pre>new URL('./ok.png', import.meta.url).href</pre>
  <img src="${new URL('./ok.png', import.meta.url).href}" alt="NOT OK" width="30" />
`
