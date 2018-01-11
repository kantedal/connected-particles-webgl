import LineNetwork from './programs/line-network'
import MouseLines from './programs/mouse-lines'
import PointCloud from './programs/point-cloud'
import PointPosCompute from './programs/point-pos-compute'
import { gl } from './utils/render-context'
import Background from './programs/background'
import PointVelCompute from './programs/point-vel-compute'

export default class ConenctedParticles {
  private _pointPosComputeShader: PointPosCompute
  private _pointVelComputeShader: PointVelCompute
  private _background: Background
  private _pointCloud: PointCloud
  private _lineNetwork: LineNetwork
  private _mouseLines: MouseLines

  private _mousePosition: number[]

  constructor() {
    const numPoints = 16

    this._pointVelComputeShader = new PointVelCompute(numPoints)    
    this._pointPosComputeShader = new PointPosCompute(numPoints)
  
    this._background = new Background()
    this._pointCloud = new PointCloud(numPoints)
    this._lineNetwork = new LineNetwork(numPoints)
    this._mouseLines = new MouseLines(numPoints)

    this._mousePosition = [10, 10]
    document.onmousemove = (e) => {
      this._mousePosition[0] = 2.0 * (e.clientX / window.innerWidth - 0.5)
      this._mousePosition[1] = -2.0 * (e.clientY / window.innerHeight - 0.5)
    }

    let time = 0.0
    const render = () => {
      this._pointVelComputeShader.compute(this._pointPosComputeShader.texture, time, this._mousePosition)
      this._pointPosComputeShader.compute(this._pointVelComputeShader.texture, time, this._mousePosition)

      gl.clearColor(0.0, 0.0, 0.0, 0.0)      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      this._background.render()
      this._lineNetwork.render(this._pointPosComputeShader.texture)
      this._mouseLines.render(this._pointPosComputeShader.texture, this._mousePosition)
      this._pointCloud.render(this._pointPosComputeShader.texture, time)

      time += 0.01
      requestAnimationFrame(render)
    }
      
    render()
    // render()
    // render()
    // render()
    // render()
    // render()
    // render()
  }
}
