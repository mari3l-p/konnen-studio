const REVIEWS = [
  {
    name: "Valeria",
    rating: 5,
    text: "Las clases son intensas y desafiantes y me encanta ver el progreso en mi cuerpo.",
    hasAccent: true,
  },
  {
    name: "Renata",
    rating: 5,
    text: "El ambiente es motivador y la retroalimentación constante realmente marca la diferencia en mi progreso.",
    hasAccent: true,
  },
  {
    name: "Camila",
    rating: 5,
    text: "Como principiante, me sentí integrada desde el primer día. Me dieron la confianza necesaria para empezar este nuevo estilo de vida.",
    hasAccent: true,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-1 mb-4">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-yellow-400 text-2xl">★</span>
      ))}
    </div>
  );
}

export default function ReseñasSection() {
  return (
    <section className="w-full bg-[#f4f7fa] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-black mb-10">
          Reseñas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4"
            >
              <StarRating count={review.rating} />

              <div className="grow">
                <p className={`text-gray-700 text-sm md:text-base leading-relaxed ${
                  review.hasAccent ? "border-l-4 border-gray-300 pl-3" : ""
                }`}>
                  {review.text}
                </p>
              </div>

              <p className="font-bold text-black text-sm">{review.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}