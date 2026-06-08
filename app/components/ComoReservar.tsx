import { UserCircle, Ticket, CalendarDays, CheckCircle2 } from 'lucide-react'

export default function ComoReservar() {
  const steps = [
    {
      icon: <UserCircle className="w-7 h-7 text-gray-800" />,
      step: "Paso 1",
      title: "Crea tu cuenta",
      description: "Regístrate o inicia sesión en nuestro portal web para empezar."
    },
    {
      icon: <Ticket className="w-7 h-7 text-gray-800" />,
      step: "Paso 2",
      title: "Compra un paquete",
      description: "Elige el paquete de clases que mejor se adapte a tus metas y objetivos."
    },
    {
      icon: <CalendarDays className="w-7 h-7 text-gray-800" />,
      step: "Paso 3",
      title: "Elige tu clase",
      description: "Explora nuestros horarios y selecciona la clase que más te guste."
    },
    {
      icon: <CheckCircle2 className="w-7 h-7 text-gray-800" />,
      step: "Paso 4",
      title: "¡Listo!",
      description: "Confirma tu reserva y recibe la notificación. Nos vemos en el estudio."
    }
  ]

  return (
    <section className=" py-24 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Título de la sección */}
        <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-20 tracking-tight">
          ¿Cómo reservo?
        </h2>
        
        {/* Grid de 4 pasos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {steps.map((item, index) => (
            <div key={index} className="flex flex-col items-center text-center group">
              
              {/* Ícono con fondo gris suave */}
              <div className="w-20 h-20 bg-white rounded-[1.25rem] flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-105 group-hover:bg-gray-200">
                {item.icon}
              </div>
              
              {/* Etiqueta de Paso */}
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-3">
                {item.step}
              </span>
              
              {/* Título del paso */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {item.title}
              </h3>
              
              {/* Descripción */}
              <p className="text-gray-600 leading-relaxed text-sm max-w-[250px] md:max-w-none">
                {item.description}
              </p>

            </div>
          ))}
        </div>
      </div>
    </section>
  )
}