import Image from "next/image";

export default function Hero() {
  return (
    <div className="grow flex flex-col font-sans">
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex flex-col justify-end items-start text-white antialiased pb-20 pl-6 md:pl-16 lg:pl-20">
        
        {/* Contenedor de la Imagen de Fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.jpg"
            alt="Persona haciendo Pilates en estudio"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        {/* Overlay con tinte marrón oscuro para mantener la paleta de colores */}
        <div className="absolute inset-0 z-10 bg-[#1c1613]/55" aria-hidden="true" />

        {/* Contenido del Hero (Alineado a la izquierda, abajo) */}
        <div className="relative z-20 text-left max-w-2xl flex flex-col items-start drop-shadow-md">
          
          {/* Título Pequeño Superior */}
          <p className="text-xs md:text-sm font-medium tracking-[0.25em] uppercase text-[#E8E2DD] mb-6">
            ISLA &nbsp;·&nbsp; STUDIO &nbsp;·&nbsp; PILATES
          </p>

          {/* Título Principal Combinado */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif leading-none mb-8 text-balance text-white">
            Muévete <span className="block italic font-light text-[#E8DCC4] mt-2">con intención</span>
          </h1>
          
          {/* Separador Gráfico */}
          <hr className="w-16 border-t border-[#E8E2DD]/50 mb-8" />
          
          {/* Párrafo de Descripción */}
          <p className="text-base md:text-lg font-normal mb-12 text-[#F5F2EF]/90 max-w-xl text-balance">
            Un espacio donde el movimiento se convierte en ritual. Pilates, barre y movilidad para transformar tu cuerpo desde adentro.
          </p>
          
          {/* Contenedor de Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            {/* Botón 1: Tono crema claro con texto oscuro */}
            <a
              href="/horario"
              className="inline-block bg-[#E8E2DD] text-[#2C2421] px-10 py-4 rounded-full font-medium text-base hover:bg-white transition-colors shadow-lg text-center"
            >
              Ver horario
            </a>
            
            {/* Botón 2: Fondo semitransparente con borde sutil en tonos tierra */}
            <a
              href="/nuestras-clases"
              className="inline-block bg-[#2C2421]/40 backdrop-blur-sm border border-[#E8E2DD]/30 text-white px-10 py-4 rounded-full font-medium text-base hover:bg-[#2C2421]/60 transition-colors text-center"
            >
              Nuestras clases
            </a>
          </div>
          
        </div>

      </section>
    </div>
  );
}