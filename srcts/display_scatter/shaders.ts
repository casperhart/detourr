export const FRAGMENT_SHADER = `
varying float vSize;
varying vec3 vColor;
varying float vAlpha;
varying float vPicking;

void main(){
    // 1.0 if picking else vAlpha
    float alpha = 1.0 - (1.0 - vPicking) * (1.0 - vAlpha);
    gl_FragColor = vec4(vColor, alpha);

    // make points circular
    float distance = length(2.0 * gl_PointCoord - 1.0);
    if (distance > 1.0) {
        discard;
    }
}
`;
