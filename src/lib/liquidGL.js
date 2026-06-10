/*
 * LiquidGlass Engine V5.6 - Shader Fix & Performance Update
 * -----------------------------------------------------------------------------
 * Fixed undefined offset in Green channel.
 * Improved texture sampling accuracy.
 */

let liquidGL;

if (typeof window !== "undefined") {
  (() => {
    "use strict";

    class LiquidGLRendererInstance {
      constructor() {
        this.canvas = document.createElement("canvas");
        this.canvas.id = "liquid-gl-canvas";
        this.canvas.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;`;
        document.body.appendChild(this.canvas);

        const ctxAttribs = { alpha: true, premultipliedAlpha: true, antialias: true };
        this.gl = this.canvas.getContext("webgl2", ctxAttribs) || this.canvas.getContext("webgl", ctxAttribs);
        
        this.lenses = [];
        this.texture = null;
        this._initGL();
        this._resizeCanvas();
        window.addEventListener("resize", () => this._resizeCanvas());
      }

      async loadTexture(url) {
        if (this._lastUrl === url) return;
        this._lastUrl = url;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const gl = this.gl;
          if (this.texture) gl.deleteTexture(this.texture);
          this.texture = gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D, this.texture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        };
        img.src = url;
      }

      _initGL() {
        const vs = `#version 300 es
          in vec2 p;
          out vec2 v_uv;
          void main(){
            v_uv = (p + 1.0) * 0.5;
            gl_Position = vec4(p, 0.0, 1.0);
          }`;

        const fs = `#version 300 es
          precision highp float;
          in vec2 v_uv;
          uniform sampler2D u_tex;
          uniform vec2 u_res, u_screen;
          uniform vec4 u_bounds, u_tint;
          
          uniform float u_refThickness, u_refFactor, u_refDispersion;
          uniform float u_refFresnelRange, u_refFresnelHardness, u_refFresnelFactor;
          uniform float u_glareRange, u_glareHardness, u_glareFactor, u_glareConvergence, u_glareAngle;
          uniform float u_shapeRoundness;

          out vec4 fragColor;
          #define PI 3.14159265359

          float sdSuperellipse(vec2 p, vec2 b, float n) {
            vec2 q = abs(p);
            return pow(pow(q.x/b.x, n) + pow(q.y/b.y, n), 1.0/n) - 1.0;
          }

          void main(){
            vec2 lp = (v_uv - 0.5) * 2.0; 
            float d = -sdSuperellipse(lp, vec2(1.0), u_shapeRoundness);
            if (d < 0.0) discard;

            float xR = clamp(1.0 - d * (u_res.x/u_refThickness), 0.0, 1.0);
            float thI = asin(xR * xR);
            float thT = asin(sin(thI) / max(u_refFactor, 1.001));
            float shift = -tan(thT - thI) * 0.035;

            vec2 norm = normalize(lp);
            float disp = u_refDispersion * 0.0005;
            
            vec2 baseUV = vec2(
              (u_bounds.x + v_uv.x * u_bounds.z) / u_screen.x,
              1.0 - (u_bounds.y + (1.0 - v_uv.y) * u_bounds.w) / u_screen.y
            );
            
            vec3 col;
            col.r = texture(u_tex, baseUV - norm * shift * (1.0 + disp)).r;
            col.g = texture(u_tex, baseUV - norm * shift).g;
            col.b = texture(u_tex, baseUV - norm * shift * (1.0 - disp)).b;

            // Physical Alpha Blending (Tint)
            col = mix(col, u_tint.rgb, u_tint.a);

            // Fresnel & Glare
            float fres = clamp(pow(1.0 - d*(500.0/max(u_refFresnelRange, 1.0)) + (u_refFresnelHardness*0.01), 5.0), 0.0, 1.0);
            col = mix(col, vec3(1.0), fres * (u_refFresnelFactor*0.01) * 0.6);

            float gAng = (atan(norm.y, norm.x) - PI/4.0 + radians(u_glareAngle)) * 2.0;
            float gAF = clamp(pow((0.5+sin(gAng)*0.5)*(u_glareFactor*0.01), 0.1+(u_glareConvergence*0.01)*2.0), 0.0, 1.0);
            float gGF = clamp(pow(1.0 - d*(500.0/max(u_glareRange, 1.0)) + (u_glareHardness*0.01), 5.0), 0.0, 1.0);
            col = mix(col, vec3(1.0), gAF * gGF);

            fragColor = vec4(col, 1.0);
          }
        `;

        const gl = this.gl;
        const prog = gl.createProgram();
        const vsh = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vsh, vs.trim()); gl.compileShader(vsh);
        const fsh = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fsh, fs.trim()); gl.compileShader(fsh);
        gl.attachShader(prog, vsh); gl.attachShader(prog, fsh);
        gl.linkProgram(prog);
        gl.useProgram(prog);
        this.prog = prog;

        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
        const pLoc = gl.getAttribLocation(prog, "p");
        gl.enableVertexAttribArray(pLoc);
        gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);

        this.u = {
          tex: gl.getUniformLocation(prog, "u_tex"),
          res: gl.getUniformLocation(prog, "u_res"),
          bounds: gl.getUniformLocation(prog, "u_bounds"),
          screen: gl.getUniformLocation(prog, "u_screen"),
          tint: gl.getUniformLocation(prog, "u_tint"),
          refThickness: gl.getUniformLocation(prog, "u_refThickness"),
          refFactor: gl.getUniformLocation(prog, "u_refFactor"),
          refDispersion: gl.getUniformLocation(prog, "u_refDispersion"),
          refFresnelRange: gl.getUniformLocation(prog, "u_refFresnelRange"),
          refFresnelHardness: gl.getUniformLocation(prog, "u_refFresnelHardness"),
          refFresnelFactor: gl.getUniformLocation(prog, "u_refFresnelFactor"),
          glareRange: gl.getUniformLocation(prog, "u_glareRange"),
          glareHardness: gl.getUniformLocation(prog, "u_glareHardness"),
          glareFactor: gl.getUniformLocation(prog, "u_glareFactor"),
          glareConvergence: gl.getUniformLocation(prog, "u_glareConvergence"),
          glareAngle: gl.getUniformLocation(prog, "u_glareAngle"),
          shapeRoundness: gl.getUniformLocation(prog, "u_shapeRoundness"),
        };
      }

      _resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
      }

      addLens(el, options) {
        let lens = this.lenses.find(l => l.el === el);
        if (lens) lens.options = { ...lens.options, ...options };
        else { lens = { el, options }; this.lenses.push(lens); }
        return lens;
      }

      render() {
        if (!this.texture || !this.lenses.length) return;
        const gl = this.gl;
        gl.clearColor(0,0,0,0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.prog);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const dpr = window.devicePixelRatio || 1;
        const W = window.innerWidth, H = window.innerHeight;
        gl.uniform2f(this.u.screen, W, H);

        this.lenses.forEach(ln => {
          const rect = ln.el.getBoundingClientRect();
          if (rect.width <= 1) return;
          gl.viewport(rect.left*dpr, (H - rect.bottom)*dpr, rect.width*dpr, rect.height*dpr);
          gl.uniform2f(this.u.res, rect.width*dpr, rect.height*dpr);
          gl.uniform4f(this.u.bounds, rect.left, rect.top, rect.width, rect.height);
          
          gl.uniform1f(this.u.refThickness, ln.options.refThickness || 20);
          gl.uniform1f(this.u.refFactor, ln.options.refFactor || 1.4);
          gl.uniform1f(this.u.refDispersion, ln.options.refDispersion || 7);
          gl.uniform1f(this.u.refFresnelRange, ln.options.refFresnelRange || 30);
          gl.uniform1f(this.u.refFresnelHardness, ln.options.refFresnelHardness || 20);
          gl.uniform1f(this.u.refFresnelFactor, ln.options.refFresnelFactor || 20);
          gl.uniform1f(this.u.glareRange, ln.options.glareRange || 30);
          gl.uniform1f(this.u.glareHardness, ln.options.glareHardness || 20);
          gl.uniform1f(this.u.glareFactor, ln.options.glareFactor || 90);
          gl.uniform1f(this.u.glareConvergence, ln.options.glareConvergence || 50);
          gl.uniform1f(this.u.glareAngle, ln.options.glareAngle || -45);
          gl.uniform1f(this.u.shapeRoundness, ln.options.shapeRoundness || 5.0);
          
          const t = ln.options.tint || { r: 255, g: 255, b: 255, a: 0.1 };
          gl.uniform4f(this.u.tint, t.r/255, t.g/255, t.b/255, t.a);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        });
      }
    }

    liquidGL = function(options) {
      if (!window.__liquidGLRenderer__ || !window.__liquidGLRenderer__.addLens) {
        if (window.__liquidGLRenderer__ && window.__liquidGLRenderer__.canvas) window.__liquidGLRenderer__.canvas.remove();
        window.__liquidGLRenderer__ = new LiquidGLRendererInstance();
        const tick = () => { if (window.__liquidGLRenderer__) window.__liquidGLRenderer__.render(); requestAnimationFrame(tick); };
        requestAnimationFrame(tick);
      }
      const r = window.__liquidGLRenderer__;
      if (options.backgroundUrl) r.loadTexture(options.backgroundUrl);
      const targets = typeof options.target === "string" ? document.querySelectorAll(options.target) : (options.target instanceof NodeList ? Array.from(options.target) : (Array.isArray(options.target) ? options.target : [options.target]));
      return targets.map(el => r.addLens(el, options));
    };

    liquidGL.dispose = () => { if (window.__liquidGLRenderer__) window.__liquidGLRenderer__.lenses = []; };
  })();
}

export default liquidGL;
