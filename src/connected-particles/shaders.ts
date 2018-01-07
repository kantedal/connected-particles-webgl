// language=GLSL
export const imageRenderVertexShader = `#version 300 es

  in vec2 a_texCoord;
  in vec4 a_position;
  
  out vec2 v_texCoord;
  
  void main() {
    gl_Position = a_position;
    v_texCoord = a_texCoord;
  }
`

// language=GLSL
export const imageRenderFragmentShader = `#version 300 es
  precision mediump float;
  
  uniform sampler2D u_texture;
  in vec2 v_texCoord;
  out vec4 outColor;
  
  void main() {
    vec2 uv = vec2(v_texCoord.x, v_texCoord.y);
    // outColor = texture(u_texture, uv);
    outColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`
