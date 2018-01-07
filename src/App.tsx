import { initRenderContext } from './rendering/render-utils/render-context'
import * as React from 'react'
import './App.css'
import Renderer from './rendering/renderer'
import createFloatArrayFromSet from './rendering/utils/create-floatarray-from-set'

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
   const renderer = new Renderer()
  }
}

export default App
