import Link from "next/link";
import { siInstagram, siWhatsapp, siTiktok } from "simple-icons";

const LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/konnen.studio/",
    icon: siInstagram,
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@konnen.sc?_r=1&_t=ZS-96h0tBFSYfl",
    icon: siTiktok,
  }
];

export default function EnlacesSection() {
  return (
    <section className="w-full bg-[#f4f7fa] py-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-10 text-center">
          Enlaces
        </h2>

        <div className="flex flex-col gap-4 w-full max-w-md">
          {LINKS.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-white rounded-2xl px-6 py-4 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] border border-gray-100 group"
            >
              {/* Contenedor del Icono SVG */}
              <svg
                role="img"
                viewBox="0 0 24 24"
                className="w-6 h-6 shrink-0 fill-current text-black group-hover:text-blue transition-colors"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={link.icon.path} />
              </svg>

              <span className="text-black font-medium">{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}