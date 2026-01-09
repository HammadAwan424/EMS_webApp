import { createRoot } from 'react-dom/client'
import App from "./App.jsx"
import "./api/firebase/config.js"
import { Provider } from 'react-redux'
import store from './api/redux/store.js'
import { StrictMode } from 'react'
const strictMode = false

createRoot(document.getElementById('root')!).render( // assertion that root exists
    strictMode ? (
        <StrictMode>
            <Provider store={store}>
                <App />
            </Provider>
        </StrictMode>
    ) : (
        <Provider store={store}>
            <App />
        </Provider>
    )
)
            