import './App.css'

import * as React from 'react'

import ConnectedParticles from './connected-particles'
import { initRenderContext } from './connected-particles/utils/render-context'

const logo = require('./logo.svg')

const initGpuContext = () => {
  const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement
  initRenderContext(canvas)
}

class App extends React.Component {
  render() {
    return <canvas width={window.innerWidth} height={window.innerHeight} id='canvas'/>
  }

  componentDidMount() {
   initGpuContext()
   const connectedParticles = new ConnectedParticles()
  }
}

export default App
