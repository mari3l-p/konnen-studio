import Image from "next/image";
import { supabase } from "@/lib/supabase"; // Asegúrate de que esta ruta sea la correcta

export default async function DisciplinasSection() {
  // Obtenemos los datos directamente de Supabase ordenados por fecha de creación
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('*')
    .order('created_at', { ascending: true });

  const services = disciplinas || [];

  return (
    <section className="w-full bg-[#f4f7fa] py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center md:text-left">
          Disciplinas
        </h2>

        {services.length === 0 ? (
          <p className="text-center text-gray-500">No hay disciplinas disponibles en este momento.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow cursor-pointer"
                style={{ height: "520px" }}
              >
                {/* Full-bleed image */}
                <Image
                  src={service.image_url}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: service.object_position }}
                />

                {/* Gradient overlay — stronger at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

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
        )}
      </div>
    </section>
  );
}