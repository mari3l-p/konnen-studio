import Image from "next/image";
import AboutSection from "./components/AboutSection";
import FeaturesSection from "./components/DisciplinasSection";
import ReseñasSection from "./components/ReseñasSection";
import EnlacesSection from "./components/EnlacesSection";
import ComoReservar from "./components/ComoReservar";

export default function Home() {
  return (
    <main className="grow flex flex-col font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex items-center justify-center text-white overflow-hidden antialiased">
        
        {/* Contenedor de la Imagen de Fondo */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/verde.jpeg"
            alt="Mujer practicando Pilates"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
        </div>

        {/* 2. Capa de Superposición (Overlay) para oscurecer el fondo */}
        {/* Usamos pseudo-elementos after: para mayor limpieza */}
        <div className="absolute inset-0 z-10 bg-black/30" aria-hidden="true" />


        {/* 3. Contenedor del Contenido Central */}
        <div className="relative z-20 text-center px-4 max-w-4xl flex flex-col items-center">
          
          {/* Título Principal */}
          {/* tracking-tighter (moderno), leading-tight (menos espacio entre líneas) */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-widest md:tracking-normal uppercase leading-tight mb-4 text-balance">
            Bienvenido <br /> a Können
          </h1>
          
          {/* Subtítulo (Slogan) */}
          <p className="text-lg md:text-lg lg:text-xl font-medium mb-12 max-w-2xl text-balance">
            SI PUEDES
          </p>
          
          {/* bg-brand-blue (si lo definiste en globals.css v4) o bg-[#0052cc] */}
          <button className="bg-tertiary px-12 py-3 rounded-md font-semibold text-lg hover:bg-(--dark-tertiary) transition-colors shadow-lg">
            <a href="/horario">Reservar clase</a>
          </button>
        </div>

      </section>

      <section>
        <AboutSection/>
      </section>
      <section>
        <FeaturesSection/>
      </section>
      <section>
        <ComoReservar/>
      </section>
      <section>
        <ReseñasSection/>
        <EnlacesSection/>
      </section>


    </main>
  );
}