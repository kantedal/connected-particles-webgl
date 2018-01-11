import Shader from './shader'
import RenderTarget from './render-target'
import {gl} from './render-context'

export default class FBO extends RenderTarget {
  private _texture: WebGLTexture
  private _textureData: Float32Array
  private _writeToTexture: boolean = false
  private _framebuffer: WebGLFramebuffer

  constructor(shader: Shader, sizeX: number, sizeY: number, private _outputChannels?: number) {
    super(shader, sizeX, sizeY)
    this.resetTexture()
    this._framebuffer = gl.createFramebuffer() as WebGLFramebuffer
  }

  public render() {
    gl.viewport(0, 0, this.sizeX * this.scaleFactor, this.sizeY * this.scaleFactor)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(this._program)
    // gl.colorMask(true, false, false, false)

    gl.enableVertexAttribArray(this._positionAttribLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer)
    gl.vertexAttribPointer(this._positionAttribLocation, 2, gl.FLOAT, false, 0, 0)

    gl.enableVertexAttribArray(this._texCoordAttribLocation)
    gl.bindBuffer(gl.ARRAY_BUFFER, this._texCoordBuffer)
    gl.vertexAttribPointer(this._texCoordAttribLocation, 2, gl.FLOAT, false, 0, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, this._framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._texture, 0)

    this._shader.update()

    gl.drawArrays(gl.TRIANGLES, 0, 6)

    if (this._writeToTexture) {
      gl.readPixels(0, 0, this.sizeX, this.sizeY, gl.RGBA, gl.FLOAT, this._textureData)
    }

    // console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER))

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  public resetTexture() {
    let internalFormat = gl.RGBA32F
    let type = gl.RGBA
    let channels = 4

    if (this._outputChannels) {
      switch (this._outputChannels) {
        case 1:
          internalFormat = gl.R32F
          type = gl.RED
          channels = 1
          break
        default:
          break
      }
    }

    this._texture = gl.createTexture() as WebGLTexture
    gl.bindTexture(gl.TEXTURE_2D, this._texture)
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, this.sizeX, this.sizeY, 0, type, gl.FLOAT, null)
    gl.bindTexture(gl.TEXTURE_2D, null)

    this._textureData = new Float32Array(this.sizeX * this.sizeY * channels)
  }

  public resize(sizeX: number, sizeY: number) {
    this.setWindowSize(sizeX, sizeY)
    this.resetTexture()
  }

  public enableWriteToTexture() {
    this._writeToTexture = true
  }

  get texture(): WebGLTexture { return this._texture }
  get textureData(): Float32Array { return this._textureData }
}
