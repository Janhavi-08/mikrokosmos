import Link from "next/link";
export default function CreatorCard({ creator }) {
  return (
    <div className="card p-4">
      <img src={creator.image} alt={creator.name} className="w-full h-40 object-cover rounded mb-3" />
      <h2 className="font-bold text-lg">{creator.name}</h2>
      <p className="muted text-sm mb-3">{creator.bio}</p>
      <Link href={`/creator/${creator.id}`} className="text-primary font-semibold">View Projects</Link>
    </div>
  );
}
