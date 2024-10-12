import ReactDOM from 'react-dom/client'
import App from "./App.jsx"
import "./firebase/config.js"
import { Provider } from 'react-redux'
import store from './app/store.js'
import { StrictMode } from 'react';

const strictMode = false

ReactDOM.createRoot(document.getElementById('root')).render(
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
            