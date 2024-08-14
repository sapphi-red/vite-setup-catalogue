import 'vite/modulepreload-polyfill'
import './style.css'

document.querySelector('#app').innerHTML = `
  <h1>Hello Vite!</h1>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
  <div>Test asset</div>
  <img src="${new URL('./ok.png', import.meta.url).href}" alt="NOT OK" width="30" />
`
