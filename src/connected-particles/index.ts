import LineNetwork from './programs/line-network'
import MouseLines from './programs/mouse-lines'
import PointCloud from './programs/point-cloud'
import PointPosCompute from './programs/point-pos-compute'
import { gl } from './utils/render-context'
import Background from './programs/background'

export default class ConenctedParticles {
  private _pointPosComputeShader: PointPosCompute
  private _background: Background
  private _pointCloud: PointCloud
  private _lineNetwork: LineNetwork
  private _mouseLines: MouseLines

  constructor() {
    this._pointPosComputeShader = new PointPosCompute(64)
    
    this._background = new Background()
    this._pointCloud = new PointCloud()
    this._lineNetwork = new LineNetwork()
    this._mouseLines = new MouseLines()
    
    const render = () => {
      this._pointPosComputeShader.compute()

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.clearColor(0.0, 0.0, 0.0, 0.0)      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      this._background.render()
      this._lineNetwork.render(this._pointPosComputeShader.texture)
      this._mouseLines.render(this._pointPosComputeShader.texture)
      this._pointCloud.render(this._pointPosComputeShader.texture)

      requestAnimationFrame(render)
    }
    render()
  }
}
