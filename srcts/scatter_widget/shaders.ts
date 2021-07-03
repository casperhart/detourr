export const FRAGMENT_SHADER = `
varying float vSize;

void main(){
    gl_FragColor = vec4(1.);

    // make points circular
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
        discard;
    }
}
`

export const VERTEX_SHADER = `
uniform float size;

void main(){
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = 200.0 * size / -mvPosition.z;
}
`