import './App.css'

import * as React from 'react'

import ConnectedParticles from './connected-particles'
import { initRenderContext } from './connected-particles/utils/render-context'

const logo = require('./logo.svg')

class App extends React.Component {
  render() {
    return <canvas width={window.innerWidth} height={window.innerHeight} id='canvas'/>
  }

  componentDidMount() {
    const canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement
    const connectedParticles = new ConnectedParticles(canvas, 64)

    window.addEventListener('resize', (e: any) => {
      console.log(e.srcElement.innerWidth, e.srcElement.innerHeight)
      connectedParticles.resize(e.srcElement.innerWidth, e.srcElement.innerHeight)
    })
  }
}

export default App
