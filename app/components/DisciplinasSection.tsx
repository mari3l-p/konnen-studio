import Image from "next/image";

const SERVICES = [
  {
    title: "Sculpt Deep",
    description: "Diseñado para trabajar el cuerpo de forma profunda, precisa y consciente, a través de estímulos de tensión sostenida que priorizan la calidad del movimiento y la activación muscular continua.",
    extra: "Alta tensión profunda",
    image: "/sculpt.jpeg",
    objectPosition: "center top",
  },
  {
    title: "Indoor Cycling",
    description: "No es solo una clase, es una experiencia de alta energía con música envolvente. Haz ejercicio, fortalece piernas y core y libera endorfinas al ritmo de cada pedaleado!",
    image: "/Indoor.jpeg",
    objectPosition: "center center",
  },
  {
    title: "Define & Tone",
    description: "Entrenamiento al beat de la música bajo tiempos cortos y secuencias rápidas. Diseñado para trabajar el cuerpo de forma eficiente, generando resultados visibles en firmeza, fuerza y definición.",
    image: "/define.jpeg",
    extra: "Alto impacto cardiovascular",
    objectPosition: "center center",
  },
];

export default function DisciplinasSection() {
  return (
    <section className="w-full bg-[#f4f7fa] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center md:text-left">
          Disciplinas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SERVICES.map((service, index) => (
            <div
              key={index}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
              style={{ height: "520px" }}
            >
              {/* Full-bleed image */}
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                style={{ objectPosition: service.objectPosition }}
              />

              {/* Gradient overlay — stronger at bottom */}
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-transparent" />

              {/* Text content pinned to bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">
                  {service.title}
                </h3>
                <p className="text-white/80 text-sm leading-relaxed">
                  {service.description}
                </p>
                {service.extra && (
                  <p className="mt-4 text-white/60 text-xs font-semibold uppercase tracking-widest italic">
                    {service.extra}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}