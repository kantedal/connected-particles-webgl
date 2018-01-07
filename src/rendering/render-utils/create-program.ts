import Shader from './shader'

const createProgram = (gl: WebGLRenderingContext, shader: Shader): WebGLProgram => {
  const program = gl.createProgram() as WebGLProgram

  gl.attachShader(program, shader.fragmentShader)
  gl.attachShader(program, shader.vertexShader)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
  }

  shader.program = program

  return program
}

export default createProgram
