import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import Home from './components/Home.jsx'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Home/>
    </>
  )
}

export default App

