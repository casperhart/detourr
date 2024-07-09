export const VERTEX_SHADER_2D = `
uniform float size;
uniform float zoom;
uniform float picking;
uniform float shrink;

attribute float alpha;
attribute vec3 color;

// passed to fragment shader
varying vec3 vColor;
varying float vAlpha;
varying float vPicking;
varying float vShrink;

void main(){
    vColor = color;
    vAlpha = alpha;
    vPicking = picking;
    vShrink = shrink;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 2.0 * shrink + (100.0 * size * sqrt(zoom)) * (1.0 - shrink);
}
`;
