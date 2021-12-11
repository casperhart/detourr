export const FRAGMENT_SHADER = `
varying float vSize;
varying vec3 vColor;
varying float vAlpha;
varying float vAntialias;

void main(){
    
    // make points circular
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
        discard;
    }
    // alpha value for antialiased edges. fwidth is fragment width, i.e. 1px
    float delta = fwidth(distance);
    float edgeAlpha = smoothstep(1.0, 1.0-delta, distance);

    float alpha;
    if (vAntialias == 1.) {
        alpha = edgeAlpha*vAlpha;
    } else {
        alpha = 1.0;
    }

    gl_FragColor = vec4(vColor, alpha);
}
`;
