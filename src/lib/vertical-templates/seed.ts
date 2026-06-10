// ================================================================
// lib/vertical-templates/seed.ts — Built-in Vertical Templates
// Templates iniciales para cada vertical de negocio.
// ================================================================

export interface VerticalTemplateConfig {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    bannerUrl?: string;
    faviconUrl?: string;
    tagline: string;
  };
  businessSettings: {
    brandTone: string;
    shortDescription: string;
    mainPromise: string;
  };
  businessHours: {
    weeklyHours: Array<{
      day: string;
      open: string;
      close: string;
      closed: boolean;
    }>;
    holidays: string[];
    lunchBreak: string;
    lastAcceptedTime: string;
    minimumBufferMinutes: number;
    latePolicy: string;
  };
  services: Array<{
    name: string;
    duration: number;
    price: number;
    category: string;
    description?: string;
  }>;
  stylists: Array<{
    name: string;
    specialty?: string;
    active: boolean;
  }>;
  policies: {
    cancellationPolicy: string;
    latePolicy: string;
    welcomeMessage: string;
  };
  ai: {
    autoReplyEnabled: boolean;
    aiMode: string;
    aiRules: string[];
    bookingRules: string[];
    availabilityRules: string[];
  };
  knowledge: {
    salonProfile: Record<string, any>;
    faqs: Array<{ question: string; answer: string }>;
    aiRules: string[];
    prompts: string[];
  };
}

export interface TemplateSeed {
  slug: string;
  name: string;
  version: string;
  vertical: string;
  description: string;
  config: VerticalTemplateConfig;
}

// ── Templates built-in ──

export const BUILTIN_TEMPLATES: TemplateSeed[] = [
  {
    slug: "salon-belleza-v1",
    name: "Salón de Belleza",
    version: "v1",
    vertical: "salon",
    description: "Template para salones de belleza y peluquerías. Incluye servicios de corte, color, peinados, manicure y tratamientos faciales con horarios extendidos.",
    config: {
      branding: {
        primaryColor: "#7c5cff",
        secondaryColor: "#1a1a2e",
        tagline: "Tu salón de belleza de confianza",
      },
      businessSettings: {
        brandTone: "Profesional y cálido, con atención personalizada y trato cercano.",
        shortDescription: "Salón de belleza profesional con servicios de corte, color, peinados y tratamientos.",
        mainPromise: "Realzar tu belleza natural con los mejores profesionales y productos.",
      },
      businessHours: {
        weeklyHours: [
          { day: "Monday", open: "10:00", close: "19:00", closed: false },
          { day: "Tuesday", open: "10:00", close: "19:00", closed: false },
          { day: "Wednesday", open: "10:00", close: "19:00", closed: false },
          { day: "Thursday", open: "10:00", close: "19:00", closed: false },
          { day: "Friday", open: "10:00", close: "19:00", closed: false },
          { day: "Saturday", open: "10:00", close: "16:00", closed: false },
          { day: "Sunday", open: "", close: "", closed: true },
        ],
        holidays: ["2026-01-01", "2026-05-01", "2026-09-18", "2026-12-25"],
        lunchBreak: "14:00-15:00",
        lastAcceptedTime: "17:30",
        minimumBufferMinutes: 15,
        latePolicy: "Se conserva la reserva con 10 minutos de tolerancia.",
      },
      services: [
        { name: "Corte de pelo dama", duration: 45, price: 25000, category: "corte", description: "Corte personalizado con lavado incluido" },
        { name: "Corte de pelo caballero", duration: 30, price: 15000, category: "corte" },
        { name: "Corte infantil", duration: 30, price: 12000, category: "corte" },
        { name: "Baño de color", duration: 60, price: 35000, category: "color", description: "Tinte completo con productos profesionales" },
        { name: "Mechas / Balayage", duration: 120, price: 55000, category: "color" },
        { name: "Alisado permanente", duration: 150, price: 80000, category: "tratamiento" },
        { name: "Peinado (novia/evento)", duration: 90, price: 45000, category: "peinados" },
        { name: "Lavado y soplo", duration: 30, price: 12000, category: "peinados" },
        { name: "Manicure clásico", duration: 30, price: 12000, category: "uñas" },
        { name: "Manicure semipermanente", duration: 45, price: 18000, category: "uñas" },
        { name: "Pedicure completo", duration: 45, price: 20000, category: "uñas" },
        { name: "Limpieza facial profunda", duration: 60, price: 35000, category: "facial" },
        { name: "Masaje de relajación 30 min", duration: 30, price: 25000, category: "masajes" },
      ],
      stylists: [
        { name: "María González", specialty: "Coloración y cortes", active: true },
        { name: "Carolina Muñoz", specialty: "Peinados y tratamientos", active: true },
        { name: "Valentina Rojas", specialty: "Manicure y pedicure", active: true },
      ],
      policies: {
        cancellationPolicy: "Puedes cancelar tu reserva con hasta 4 horas de anticipación sin costo.",
        latePolicy: "Se conserva la reserva con 10 minutos de tolerancia. Después de ese tiempo, podríamos necesitar reagendar.",
        welcomeMessage: "¡Bienvenida a nuestro salón! Cuéntanos qué servicio te gustaría y te atenderemos con la mejor disposición.",
      },
      ai: {
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          "Saludar siempre con amabilidad y ofrecer ayuda personalizada.",
          "Preguntar si es la primera visita o si ya conoce el salón.",
          "Ofrecer servicios según el tipo de cabello o necesidad que exprese.",
        ],
        bookingRules: [
          "Siempre confirmar servicio, fecha y hora antes de agendar.",
          "Preguntar por stylist preferido si no se ha especificado.",
          "Verificar que el horario solicitado esté disponible antes de confirmar.",
        ],
        availabilityRules: [
          "Consultar disponibilidad en tiempo real antes de ofrecer horarios.",
          "Si no hay disponibilidad, ofrecer alternativas cercanas.",
        ],
      },
      knowledge: {
        salonProfile: {
          name: "Salón de Belleza",
          description: "Salón profesional con más de 5 años de experiencia",
          specialties: ["Cortes", "Coloración", "Peinados", "Manicure", "Tratamientos faciales"],
        },
        faqs: [
          { question: "¿Necesito reservar hora?", answer: "Sí, recomendamos reservar para asegurar tu horario. Puedes hacerlo por WhatsApp." },
          { question: "¿Aceptan tarjetas de crédito?", answer: "Sí, aceptamos efectivo, tarjetas de débito, crédito y transferencias." },
          { question: "¿Cuánto dura un baño de color?", answer: "Aproximadamente 60 minutos, dependiendo del largo y tipo de cabello." },
        ],
        aiRules: [
          "Responder siempre en español, con tono profesional y cálido.",
          "Si no sabes la respuesta, ofrece consultar con el equipo del salón.",
        ],
        prompts: [
          "Eres la asistente virtual de un salón de belleza profesional. Tu tono debe ser cálido, profesional y servicial.",
        ],
      },
    },
  },
  {
    slug: "barberia-v1",
    name: "Barbería Premium",
    version: "v1",
    vertical: "barber",
    description: "Template para barberías clásicas y modernas. Cortes de caballero, barba, afeitado clásico y tratamientos capilares.",
    config: {
      branding: {
        primaryColor: "#1a1a2e",
        secondaryColor: "#c9a84c",
        tagline: "Estilo clásico con tendencia moderna",
      },
      businessSettings: {
        brandTone: "Masculino, moderno pero con toques de barbería clásica. Directo y con actitud.",
        shortDescription: "Barbería profesional con cortes modernos y clásicos, afeitado tradicional y cuidado capilar.",
        mainPromise: "Cada corte es una obra de arte. Precisión, estilo y tradición.",
      },
      businessHours: {
        weeklyHours: [
          { day: "Monday", open: "10:00", close: "20:00", closed: false },
          { day: "Tuesday", open: "10:00", close: "20:00", closed: false },
          { day: "Wednesday", open: "10:00", close: "20:00", closed: false },
          { day: "Thursday", open: "10:00", close: "20:00", closed: false },
          { day: "Friday", open: "10:00", close: "21:00", closed: false },
          { day: "Saturday", open: "10:00", close: "18:00", closed: false },
          { day: "Sunday", open: "", close: "", closed: true },
        ],
        holidays: ["2026-01-01", "2026-05-01", "2026-09-18", "2026-12-25"],
        lunchBreak: "14:00-15:00",
        lastAcceptedTime: "19:00",
        minimumBufferMinutes: 10,
        latePolicy: "Se conserva la reserva con 10 minutos de tolerancia.",
      },
      services: [
        { name: "Corte moderno", duration: 30, price: 15000, category: "corte" },
        { name: "Corte clásico", duration: 30, price: 12000, category: "corte" },
        { name: "Corte infantil", duration: 25, price: 10000, category: "corte" },
        { name: "Arreglo de barba", duration: 20, price: 8000, category: "barba" },
        { name: "Corte + Barba", duration: 45, price: 20000, category: "corte" },
        { name: "Afeitado clásico con toalla caliente", duration: 40, price: 18000, category: "barba" },
        { name: "Tratamiento capilar", duration: 30, price: 15000, category: "tratamiento" },
        { name: "Corte degradado (fade)", duration: 40, price: 18000, category: "corte" },
      ],
      stylists: [
        { name: "Carlos Martínez", specialty: "Cortes modernos y fade", active: true },
        { name: "Andrés Soto", specialty: "Barba y afeitado clásico", active: true },
        { name: "Diego Ramírez", specialty: "Cortes clásicos e infantiles", active: true },
      ],
      policies: {
        cancellationPolicy: "Puedes cancelar con 2 horas de anticipación sin costo.",
        latePolicy: "10 minutos de tolerancia. Después se pierde la hora.",
        welcomeMessage: "¡Bienvenido a la barbería! ¿Qué estilo buscas hoy? Cuéntanos y te asesoramos.",
      },
      ai: {
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          "Saludar de forma masculina pero educada.",
          "Ofrecer recomendaciones de estilo si el cliente está indeciso.",
          "Preguntar si es primera vez en la barbería.",
        ],
        bookingRules: [
          "Confirmar servicio y barbero antes de agendar.",
          "Verificar disponibilidad del barbero seleccionado.",
          "Preguntar si necesita algún servicio adicional.",
        ],
        availabilityRules: [
          "Consultar disponibilidad antes de ofrecer horarios.",
          "Ofrecer barberos alternativos si el preferido no está disponible.",
        ],
      },
      knowledge: {
        salonProfile: {
          name: "Barbería Premium",
          description: "Barbería moderna con técnicas clásicas",
          specialties: ["Cortes fade", "Barba", "Afeitado clásico", "Tratamientos capilares"],
        },
        faqs: [
          { question: "¿Hacen cortes a domicilio?", answer: "No, todas las atenciones son en nuestra barbería." },
          { question: "¿Aceptan tarjetas?", answer: "Sí, débito, crédito, efectivo y transferencia." },
          { question: "¿Cuánto dura un corte?", answer: "Entre 25 y 40 minutos dependiendo del estilo." },
        ],
        aiRules: [
          "Responder en español con tono directo y amigable.",
          "No usar lenguaje demasiado formal.",
        ],
        prompts: [
          "Eres el asistente virtual de una barbería moderna, con estilo clásico. Habla con confianza y cercanía.",
        ],
      },
    },
  },
  {
    slug: "spa-bienestar-v1",
    name: "Spa & Bienestar",
    version: "v1",
    vertical: "spa",
    description: "Template para spas y centros de bienestar. Masajes, tratamientos corporales, faciales, hidroterapia y rituales de relajación.",
    config: {
      branding: {
        primaryColor: "#059669",
        secondaryColor: "#064e3b",
        tagline: "Tu oasis de bienestar y relajación",
      },
      businessSettings: {
        brandTone: "Sereno, acogedor, calmado y profesional. Transmite paz y bienestar.",
        shortDescription: "Spa profesional con masajes, tratamientos faciales, hidroterapia y rituales de bienestar.",
        mainPromise: "Renueva tu mente, cuerpo y espíritu con experiencias únicas de bienestar.",
      },
      businessHours: {
        weeklyHours: [
          { day: "Monday", open: "09:00", close: "20:00", closed: false },
          { day: "Tuesday", open: "09:00", close: "20:00", closed: false },
          { day: "Wednesday", open: "09:00", close: "20:00", closed: false },
          { day: "Thursday", open: "09:00", close: "20:00", closed: false },
          { day: "Friday", open: "09:00", close: "20:00", closed: false },
          { day: "Saturday", open: "10:00", close: "18:00", closed: false },
          { day: "Sunday", open: "10:00", close: "16:00", closed: false },
        ],
        holidays: ["2026-01-01", "2026-12-25"],
        lunchBreak: "",
        lastAcceptedTime: "18:00",
        minimumBufferMinutes: 30,
        latePolicy: "15 minutos de tolerancia. Después se reduce el tiempo del tratamiento.",
      },
      services: [
        { name: "Masaje descontracturante 60 min", duration: 60, price: 40000, category: "masajes" },
        { name: "Masaje relajante 60 min", duration: 60, price: 35000, category: "masajes" },
        { name: "Masaje con piedras calientes", duration: 75, price: 50000, category: "masajes" },
        { name: "Limpieza facial profunda", duration: 60, price: 38000, category: "facial" },
        { name: "Hidratación facial avanzada", duration: 60, price: 42000, category: "facial" },
        { name: "Exfoliación corporal", duration: 45, price: 30000, category: "corporal" },
        { name: "Envoltura de algas", duration: 60, price: 45000, category: "corporal" },
        { name: "Ritual de hidroterapia", duration: 90, price: 55000, category: "hidroterapia" },
        { name: "Sauna + Hidroterapia", duration: 120, price: 35000, category: "hidroterapia" },
      ],
      stylists: [
        { name: "Sofía Torres", specialty: "Masajes y tratamientos corporales", active: true },
        { name: "Daniela Valdés", specialty: "Faciales y aromaterapia", active: true },
      ],
      policies: {
        cancellationPolicy: "Cancelación con hasta 6 horas de anticipación. Menos de 6 horas tiene cargo del 50%.",
        latePolicy: "15 minutos de tolerancia. Después se reduce el tiempo del tratamiento para no afectar a otros clientes.",
        welcomeMessage: "Bienvenido a tu espacio de bienestar. Cuéntanos cómo te sientes hoy y qué tipo de experiencia buscas.",
      },
      ai: {
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          "Hablar siempre con tono calmado y sereno.",
          "Preguntar si es primera vez en el spa o si ya conoce los tratamientos.",
          "Preguntar si tiene alguna lesión o condición especial antes de recomendar masajes.",
        ],
        bookingRules: [
          "Siempre preguntar si es la primera vez.",
          "Confirmar tipo de tratamiento, duración y terapeuta.",
          "Respetar tiempos entre tratamientos (mínimo 30 min de buffer).",
        ],
        availabilityRules: [
          "Spas requieren al menos 30 minutos entre reservas.",
          "Verificar disponibilidad del terapeuta y sala de tratamiento.",
        ],
      },
      knowledge: {
        salonProfile: {
          name: "Spa & Bienestar",
          description: "Centro de bienestar integral",
          specialties: ["Masajes", "Faciales", "Hidroterapia", "Aromaterapia"],
        },
        faqs: [
          { question: "¿Debo llevar algo especial?", answer: "Solo tú. Nosotros proveemos bata, toallas y todo lo necesario." },
          { question: "¿Hay estacionamiento?", answer: "Sí, tenemos estacionamiento gratuito." },
          { question: "¿Puedo comprar un gift card?", answer: "Sí, tenemos tarjetas de regalo desde $30.000." },
        ],
        aiRules: [
          "Responder siempre en español con tono tranquilo y sereno.",
          "Preguntar por alergias o condiciones médicas antes de recomendar tratamientos.",
        ],
        prompts: [
          "Eres la recepcionista virtual de un spa de lujo. Tu tono debe ser sereno, profesional y acogedor. Ayuda a los clientes a encontrar el tratamiento perfecto.",
        ],
      },
    },
  },
  {
    slug: "centro-estetica-v1",
    name: "Centro de Estética Avanzada",
    version: "v1",
    vertical: "estetica",
    description: "Template para centros de estética avanzada y medicina estética. Depilación láser, tratamientos corporales, faciales avanzados y aparatología.",
    config: {
      branding: {
        primaryColor: "#be185d",
        secondaryColor: "#2d1b2e",
        tagline: "Transforma tu belleza con tecnología avanzada",
      },
      businessSettings: {
        brandTone: "Profesional, moderno, aspiracional. Transmite resultados reales con respaldo clínico.",
        shortDescription: "Centro de estética avanzada con tratamientos innovadores y tecnología de última generación.",
        mainPromise: "Resultados visibles desde la primera sesión con la mejor tecnología estética.",
      },
      businessHours: {
        weeklyHours: [
          { day: "Monday", open: "09:00", close: "20:00", closed: false },
          { day: "Tuesday", open: "09:00", close: "20:00", closed: false },
          { day: "Wednesday", open: "09:00", close: "20:00", closed: false },
          { day: "Thursday", open: "09:00", close: "20:00", closed: false },
          { day: "Friday", open: "09:00", close: "20:00", closed: false },
          { day: "Saturday", open: "10:00", close: "15:00", closed: false },
          { day: "Sunday", open: "", close: "", closed: true },
        ],
        holidays: ["2026-01-01", "2026-05-01", "2026-09-18", "2026-12-25"],
        lunchBreak: "14:00-15:00",
        lastAcceptedTime: "19:00",
        minimumBufferMinutes: 15,
        latePolicy: "10 minutos de tolerancia.",
      },
      services: [
        { name: "Depilación láser axilas (sesión)", duration: 20, price: 15000, category: "depilacion" },
        { name: "Depilación láser piernas completas", duration: 45, price: 35000, category: "depilacion" },
        { name: "Depilación láser facial", duration: 15, price: 12000, category: "depilacion" },
        { name: "Radiofrecuencia facial", duration: 45, price: 40000, category: "facial" },
        { name: "HIFU facial (lifting ultrasonido)", duration: 60, price: 80000, category: "facial" },
        { name: "Criolipólisis abdominal", duration: 60, price: 55000, category: "corporal" },
        { name: "Mesoterapia corporal", duration: 45, price: 45000, category: "corporal" },
        { name: "Drenaje linfático manual", duration: 60, price: 35000, category: "corporal" },
        { name: "Peeling químico", duration: 30, price: 30000, category: "facial" },
        { name: "Microneedling facial", duration: 60, price: 50000, category: "facial" },
        { name: "Electroporación (sin agujas)", duration: 45, price: 35000, category: "facial" },
      ],
      stylists: [
        { name: "Karla Jiménez", specialty: "Depilación láser y aparatología", active: true },
        { name: "Pamela Vega", specialty: "Tratamientos faciales avanzados", active: true },
        { name: "Javiera Muñoz", specialty: "Criolipólisis y corporales", active: true },
      ],
      policies: {
        cancellationPolicy: "Cancelación con 4 horas de anticipación. Sesiones no canceladas se pierden.",
        latePolicy: "10 minutos de tolerancia. Después se reduce el tiempo de tratamiento.",
        welcomeMessage: "¡Bienvenida a nuestro centro de estética! Cuéntanos qué te gustaría mejorar y te recomendamos el mejor tratamiento.",
      },
      ai: {
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          "Preguntar si es primera consulta o ya es paciente.",
          "Preguntar por contraindicaciones o condiciones médicas antes de recomendar tratamientos.",
          "Explicar que los resultados pueden variar según cada persona.",
        ],
        bookingRules: [
          "Confirmar tratamiento, profesional y hora.",
          "Preguntar si requiere evaluación previa (muchos tratamientos la requieren).",
          "Recordar que algunas sesiones tienen un intervalo mínimo entre ellas.",
        ],
        availabilityRules: [
          "Tratamientos largos (>60 min) requieren buffer de 30 min.",
          "Depilación láser requiere al menos 4 semanas entre sesiones.",
        ],
      },
      knowledge: {
        salonProfile: {
          name: "Centro de Estética Avanzada",
          description: "Estética con respaldo profesional y tecnología de punta",
          specialties: ["Depilación láser", "Aparatología", "Faciales avanzados", "Corporales"],
        },
        faqs: [
          { question: "¿Duele la depilación láser?", answer: "Es una sensación de calor soportable. La mayoría de pacientes lo tolera muy bien." },
          { question: "¿Cuántas sesiones de láser necesito?", answer: "Depende de la zona y tipo de vello. En promedio 6-8 sesiones." },
          { question: "¿Hay evaluación previa?", answer: "Sí, para la mayoría de los tratamientos hacemos una evaluación gratuita." },
        ],
        aiRules: [
          "Responder en español con tono profesional pero cercano.",
          "No hacer promesas de resultados sin evaluación previa.",
          "Derivar a evaluación presencial si hay dudas sobre el tratamiento.",
        ],
        prompts: [
          "Eres la asistente virtual de un centro de estética avanzada. Responde con profesionalismo y cercanía. Ayuda a los clientes a encontrar el tratamiento ideal según sus necesidades.",
        ],
      },
    },
  },
  {
    slug: "clinica-estetica-v1",
    name: "Clínica Estética",
    version: "v1",
    vertical: "clinica",
    description: "Template para clínicas de medicina y cirugía estética. Procedimientos médicos, tratamientos con especialistas y cirugías menores.",
    config: {
      branding: {
        primaryColor: "#2563eb",
        secondaryColor: "#0f172a",
        tagline: "Medicina estética con excelencia y seguridad",
      },
      businessSettings: {
        brandTone: "Serio, médico, profesional. Transmite confianza, seguridad y resultados clínicamente respaldados.",
        shortDescription: "Clínica de medicina estética con especialistas certificados y procedimientos seguros.",
        mainPromise: "Transformación segura con resultados naturales y médicos especialistas.",
      },
      businessHours: {
        weeklyHours: [
          { day: "Monday", open: "09:00", close: "19:00", closed: false },
          { day: "Tuesday", open: "09:00", close: "19:00", closed: false },
          { day: "Wednesday", open: "09:00", close: "19:00", closed: false },
          { day: "Thursday", open: "09:00", close: "19:00", closed: false },
          { day: "Friday", open: "09:00", close: "18:00", closed: false },
          { day: "Saturday", open: "10:00", close: "14:00", closed: false },
          { day: "Sunday", open: "", close: "", closed: true },
        ],
        holidays: ["2026-01-01", "2026-05-01", "2026-09-18", "2026-12-25"],
        lunchBreak: "13:00-14:00",
        lastAcceptedTime: "17:00",
        minimumBufferMinutes: 30,
        latePolicy: "15 minutos de tolerancia. Procedimientos con hora estricta no pueden retrasarse.",
      },
      services: [
        { name: "Consulta medicina estética", duration: 45, price: 30000, category: "consulta" },
        { name: "Botox (toxina botulínica)", duration: 30, price: 120000, category: "inyectables" },
        { name: "Ácido hialurónico labios", duration: 30, price: 150000, category: "inyectables" },
        { name: "Ácido hialurónico pómulos", duration: 30, price: 180000, category: "inyectables" },
        { name: "Hilos tensores faciales", duration: 60, price: 250000, category: "hilos" },
        { name: "Plasma rico en plaquetas (PRP) facial", duration: 45, price: 80000, category: "regenerativo" },
        { name: "Carboxiterapia", duration: 30, price: 35000, category: "corporal" },
        { name: "Láser CO2 fraccionado", duration: 60, price: 180000, category: "laser" },
        { name: "Evaluación pre-quirúrgica", duration: 60, price: 50000, category: "consulta" },
      ],
      stylists: [
        { name: "Dra. Andrea Martínez", specialty: "Medicina estética y facial", active: true },
        { name: "Dra. Camila Vega", specialty: "Cirugía estética menor", active: true },
        { name: "Dr. Roberto Silva", specialty: "Láser y tratamientos regenerativos", active: true },
      ],
      policies: {
        cancellationPolicy: "Cancelación con 24 horas de anticipación. Menos de 24 horas tiene cargo del 50%.",
        latePolicy: "15 minutos de tolerancia. Procedimientos programados con médico no pueden retrasarse.",
        welcomeMessage: "Bienvenido a nuestra clínica. Un especialista evaluará tus necesidades y te recomendará el mejor plan de tratamiento personalizado.",
      },
      ai: {
        autoReplyEnabled: true,
        aiMode: "automatic",
        aiRules: [
          "Preguntar si es primera consulta.",
          "NO recomendar dosis ni tratamientos médicos específicos. Siempre derivar a consulta presencial.",
          "Explicar que los resultados varían y requieren evaluación médica.",
          "Preguntar por alergias, medicamentos y condiciones preexistentes.",
        ],
        bookingRules: [
          "Siempre requerir consulta previa antes de agendar procedimientos.",
          "Confirmar especialista y tipo de consulta.",
          "Recordar que algunos procedimientos requieren exámenes previos.",
        ],
        availabilityRules: [
          "Consultas de 45 min mínimo.",
          "Procedimientos requieren evaluación previa antes de agendar.",
          "Respetar ayunos y preparación pre-procedimiento.",
        ],
      },
      knowledge: {
        salonProfile: {
          name: "Clínica Estética",
          description: "Medicina estética con especialistas certificados",
          specialties: ["Medicina estética", "Inyectables", "Láser", "Cirugía menor", "Regenerativo"],
        },
        faqs: [
          { question: "¿Necesito orden médica?", answer: "No, puedes agendar una consulta directa con nuestros especialistas." },
          { question: "¿Duele el ácido hialurónico?", answer: "Se aplica anestesia tópica, la molestia es mínima." },
          { question: "¿Cuánto dura el botox?", answer: "Entre 3 y 6 meses, dependiendo del metabolismo de cada paciente." },
        ],
        aiRules: [
          "Responder en español con tono profesional y serio.",
          "No dar diagnósticos ni recomendaciones médicas específicas.",
          "Siempre derivar a consulta presencial para procedimientos.",
          "Usar lenguaje inclusivo y respetuoso.",
        ],
        prompts: [
          "Eres la asistente virtual de una clínica de medicina estética. Tu tono debe ser profesional, sereno y transmitir confianza. No diagnostiques ni recomiendes tratamientos específicos; siempre deriva a una consulta presencial con nuestros especialistas.",
        ],
      },
    },
  },
];
