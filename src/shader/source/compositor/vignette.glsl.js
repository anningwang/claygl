export default "@export clay.compositor.vignette\n#define OUTPUT_ALPHA\nvarying vec2 v_Texcoord;\nuniform sampler2D texture;\nuniform float darkness: 1;\nuniform float offset: 1;\n@import clay.util.rgbm\nvoid main()\n{\n    vec4 texel = decodeHDR(texture2D(texture, v_Texcoord));\n    gl_FragColor.rgb = texel.rgb;\n    vec2 uv = (v_Texcoord - vec2(0.5)) * vec2(offset);\n    gl_FragColor = encodeHDR(vec4(mix(texel.rgb, vec3(1.0 - darkness), dot(uv, uv)), texel.a));\n}\n@end";
