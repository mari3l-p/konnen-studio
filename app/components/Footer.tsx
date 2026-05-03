import Link from "next/link";
import { siInstagram, siYoutube, siFacebook } from "simple-icons";

const NAV_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Horarios", href: "#horarios" },
  { label: "Eventos", href: "#precios" },
  { label: "Paquetes", href: "#contacto" },
];


const SOCIAL = [
  { icon: siInstagram, href: "https://www.instagram.com/konnen.studio/", label: "Instagram" },
  // { icon: siFacebook, href: "...", label: "Facebook" },
  // { icon: siYoutube, href: "...", label: "YouTube" },
];

// Componente para renderizar los iconos de Simple Icons de forma segura
function SimpleIcon({ path, label }: { path: string; label: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className="w-5 h-5 fill-current"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <path d={path} />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black text-white font-sans">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-2xl font-black uppercase tracking-tighter">Können Studio</span>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs font-medium">
              Tu espacio para moverte, crecer y sentirte bien. Clases de Sculpt deep, Indoor Cycling y Define & Tone.
            </p>
            <div className="flex gap-4 mt-2">
              {SOCIAL.map(({ icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <SimpleIcon path={icon.path} label={label} />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Navegación
            </span>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/70 hover:text-white text-sm transition-colors w-fit font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contacto*/}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
              Dirección
            </span>
            <p className="text-white/70 text-sm font-medium">📍 Isauro Rossette #3, La Merced,</p>
            <p className="text-white/70 text-sm font-medium">San Cristóbal de Las Casas</p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 text-white/30 text-[10px] md:text-xs uppercase tracking-widest font-bold">
          <span>© {currentYear} Können. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}