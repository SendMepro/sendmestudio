export const ANALYTICS_DATA = {
  userMode: {
    hero: {
      headline: "Tu estudio respira excelencia.",
      subheadline: "La afinidad emocional con tus muses VIP ha subido un 12% esta semana.",
      backgroundImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1600", // Luxury salon background
    },
    recommendations: [
      {
        id: "rec_1",
        title: "Momento Balayage",
        description: "6 muses han consultado por cambios de look hoy. Activa la 'Narrativa de Luz' para maximizar conversiones.",
        cta: "Activar Narrativa",
        image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800",
      },
      {
        id: "rec_2",
        title: "Fidelización VIP",
        description: "Ana López y 2 muses más no han recibido su ritual de hidratación este mes.",
        cta: "Enviar Invitación",
        image: "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80&w=800",
      }
    ],
    likedImages: [
      "https://images.unsplash.com/photo-1595476108010-b4d1f8bc2b13?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1527799863830-226e6ef1982b?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=400",
    ]
  },
  techMode: {
    agents: [
      { id: "core", name: "Cerebro Principal", status: "optimal", load: 12 },
      { id: "creative", name: "Director Creativo", status: "active", load: 45 },
      { id: "brand", name: "Inspector de Marca", status: "active", load: 8 },
      { id: "logical", name: "Coordinador Lógico", status: "active", load: 22 },
      { id: "predictor", name: "Style Predictor", status: "standby", load: 0 },
    ],
    health: {
      logic: 98.4,
      style: 95.2,
      memory: 99.1,
    },
    recentEvents: [
      { time: "10:24", agent: "Coordinador Lógico", msg: "Validación de prompt 'Balayage Premium' exitosa." },
      { time: "10:22", agent: "Director Creativo", msg: "Nueva narrativa visual generada para segmento VIP." },
      { time: "09:45", agent: "Cerebro Principal", msg: "Sincronización de memoria evolutiva completada." },
    ]
  }
};
