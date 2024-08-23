import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import Home from './components/Home.jsx'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <h1 className='text-[40px] text-center'>
        First Electron-vite-react project
      </h1>
      <Home/>
    </>
  )
}

export default App

