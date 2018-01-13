import Background from './programs/background'
import ClothCompute from './programs/cloth-compute'
import LineNetwork from './programs/line-network'
import MouseLines from './programs/mouse-lines'
import PointCloud from './programs/point-cloud'
import SpringMassCompute from './programs/sprint-mass-compute'
import { gl, initRenderContext } from './utils/render-context'

export default class ConenctedParticles {
  private _pointSpringMassCompute: SpringMassCompute
  private _pointClothCompute: ClothCompute
  private _background: Background
  private _pointCloud: PointCloud
  private _lineNetwork: LineNetwork
  private _mouseLines: MouseLines

  private _mousePosition: number[]

  constructor(private _canvasElement: HTMLCanvasElement, numPoints: number) {
    initRenderContext(_canvasElement)

    this._pointSpringMassCompute = new SpringMassCompute(numPoints)    
    this._pointClothCompute = new ClothCompute(numPoints)
  
    this._background = new Background()
    this._pointCloud = new PointCloud(numPoints)
    this._lineNetwork = new LineNetwork(numPoints)
    this._mouseLines = new MouseLines(numPoints)

    this._mousePosition = [10, 10]
    document.onmousemove = (e) => {
      this._mousePosition[0] = 2.0 * (e.clientX / window.innerWidth - 0.5)
      this._mousePosition[1] = -2.0 * (e.clientY / window.innerHeight - 0.5)
    }

    this.resize(this._canvasElement.width, this._canvasElement.height)

    let time = 0.0
    const render = () => {
      this._pointSpringMassCompute.compute(this._pointClothCompute.texture, time, this._mousePosition)
      this._pointClothCompute.compute(this._pointSpringMassCompute.texture, this._pointClothCompute.texture, time, this._mousePosition)     
      
      gl.clearColor(0.0, 0.0, 0.0, 0.0)      
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.disable(gl.DEPTH_TEST)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

      this._background.render(time)
      this._lineNetwork.render(this._pointClothCompute.texture)
      this._mouseLines.render(this._pointClothCompute.texture, this._mousePosition)
      this._pointCloud.render(this._pointClothCompute.texture, time)

      time += 0.01
      requestAnimationFrame(render)
    }
      
    render()
  }

  public resize(width: number, height: number) {
    this._canvasElement.width = width
    this._canvasElement.height = height
    
    const widthProportions = width / height
    // this._pointSpringMassCompute.setProportions(widthProportions, 1.0)
    // this._pointClothCompute.setProportions(widthProportions, 1.0)
    this._lineNetwork.setProportions(widthProportions, 1.0)

    this._background.resize(width, height)
    console.log(width / height)
  }
}
