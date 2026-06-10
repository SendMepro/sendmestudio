declare module "@/lib/liquidGL" {
  interface LiquidGLOptions {
    target: string | Element | Element[] | NodeList;
    snapshot?: string;
    resolution?: number;
    refraction?: number;
    bevelDepth?: number;
    bevelWidth?: number;
    frost?: number;
    specular?: boolean;
    reveal?: "fade" | "none";
    magnify?: number;
  }

  interface LiquidGLInstance {
    updateMetrics(): void;
    // ... add more if needed
  }

  function liquidGL(options?: LiquidGLOptions): LiquidGLInstance | LiquidGLInstance[];
  
  namespace liquidGL {
    function registerDynamic(elements: string | Element | Element[]): void;
    function dispose(): void;
  }

  export default liquidGL;
}
